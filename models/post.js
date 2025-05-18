module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', {
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1 // 1 = active, -1 = deleted
        }
    }, {
        tableName: 'posts',
        timestamps: false
    });
    return Post;
};