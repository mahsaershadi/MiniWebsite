module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1 // 1 = active, -1 = deleted
        }
    }, {
        tableName: 'users',
        timestamps: false
    });
    return User;
};