module.exports = (sequelize, DataTypes) => {
    const Photo = sequelize.define('Photo', {
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        uploadedat: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1 // 1 = active, -1 = deleted
        },
        original_filename: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'photos',
        timestamps: false,
        indexes: [
        {
            unique: true,
            fields: ['filename', 'user_id']
        }
    ]
    });

    return Photo;
};
