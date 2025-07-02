import { Transaction } from 'sequelize';
import Post from '../models/post';
import PostVersion from '../models/postVersion';
import User from '../models/user';

export interface VersioningOptions {
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  changedBy: number;
  changeReason?: string;
  transaction?: Transaction;
}

//Create a version snapshot of a post before updating it
export const createPostVersion = async (
  post: Post,
  options: VersioningOptions
): Promise<PostVersion> => {
  try {
    //Get the next version number for this post
    const lastVersion = await PostVersion.findOne({
      where: { postId: post.id },
      order: [['versionNumber', 'DESC']],
      transaction: options.transaction
    });

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    //Create the version record
    const version = await PostVersion.create({
      postId: post.id,
      versionNumber: nextVersionNumber,
      title: post.title,
      description: post.description,
      price: post.price,
      userId: post.userId,
      categoryId: post.categoryId,
      cover_photo_id: post.cover_photo_id,
      status: post.status,
      stock_quantity: post.stock_quantity,
      attributes: post.attributes,
      changedBy: options.changedBy,
      changeType: options.changeType,
      changeReason: options.changeReason
    }, {
      transaction: options.transaction
    });

    return version;
  } catch (error) {
    console.error('Error creating post version:', error);
    throw new Error('Failed to create post version');
  }
};

//Get version history for a post
export const getPostVersionHistory = async (postId: number) => {
  try {
    const versions = await PostVersion.findAll({
      where: { postId },
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'changedByUser',
          attributes: ['id', 'username']
        }
      ],
      order: [['versionNumber', 'DESC']]
    });

    return versions;
  } catch (error) {
    console.error('Error fetching post version history:', error);
    throw new Error('Failed to fetch post version history');
  }
};

//Get a specific version of a post

export const getPostVersion = async (postId: number, versionNumber: number) => {
  try {
    const version = await PostVersion.findOne({
      where: { postId, versionNumber },
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'changedByUser',
          attributes: ['id', 'username']
        }
      ]
    });

    return version;
  } catch (error) {
    console.error('Error fetching post version:', error);
    throw new Error('Failed to fetch post version');
  }
};


//Restore a post to a specific version
export const restorePostVersion = async (
  postId: number, 
  versionNumber: number, 
  changedBy: number,
  changeReason?: string,
  transaction?: Transaction
) => {
  try {
    //Get the version to restore
    const version = await getPostVersion(postId, versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }

    //Get the current post
    const currentPost = await Post.findByPk(postId, { transaction });
    if (!currentPost) {
      throw new Error('Post not found');
    }

    await createPostVersion(currentPost, {
      changeType: 'UPDATE',
      changedBy,
      changeReason: `Restored to version ${versionNumber}`,
      transaction
    });

    //Restore the post to the specified version
    await currentPost.update({
      title: version.title,
      description: version.description,
      price: version.price,
      categoryId: version.categoryId,
      cover_photo_id: version.cover_photo_id,
      status: version.status,
      stock_quantity: version.stock_quantity,
      attributes: version.attributes
    }, { transaction });

    return currentPost;
  } catch (error) {
    console.error('Error restoring post version:', error);
    throw new Error('Failed to restore post version');
  }
}; 