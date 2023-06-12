const Sequelize = require("sequelize");

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        email: {
          type: Sequelize.STRING(40),
          allowNull: true,
          unique: true,
        },
        nick: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        provider: {
          type: Sequelize.ENUM("local", "kakao"),
          allowNull: false,
          defaultValue: "local",
        },
        snsId: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true, // createdAt, updatedAt
        underscored: false,
        modelName: "User",
        tableName: "users",
        paranoid: true, // deletedAt 유저 삭제일 (soft delete 복구 위해서)
        charset: "utf8mb4", // mb4는 이모티콘도 저장
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsToMany(db.User, {
      foreignKey: "followingId",
      as: "Followers",
      through: "Follow",
    });
    db.User.belongsToMany(db.User, {
      foreignKey: "followerId", // 내가 누군가를 팔로잉할 경우, 테이블에서 내 아이디부터 찾아야 팔로잉 아이디를 찾을 수 있다.
      as: "Followings",
      through: "Follow",
    });
  }
};
