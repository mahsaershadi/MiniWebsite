module.exports = (sequelize, DataTypes) => {
    const Like = sequelize.define('Like', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        post_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'posts',
                key: 'id'
            }
        }
    }, {
        tableName: 'likes',
        timestamps: false
    });
    return Like;
};