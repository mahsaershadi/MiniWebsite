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
        }
    }, {
        tableName: 'photos',
        timestamps: false
    });

    return Photo;
};
