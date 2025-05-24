// const bcrypt = require ('bcrypt');

// module.exports = (sequelize, DataTypes) => {
//     const User = sequelize.define('User', {
//         username: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             unique: true
//         },
//         password: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         status: {
//             type: DataTypes.INTEGER,
//             defaultValue: 1 // 1 = active, -1 = deleted
//         }
//     }, {
//         tableName: 'users',
//         timestamps: false
//     });

//     User.beforeCreate(async (user) => {
//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(user.password, salt);
//     });


//     User.prototype.validatePassword = async function(password) {
//         return await bcrypt.compare(password, this.password);
//     };

//     return User;
// };