export const UserQueries = {
  // GetUsers: `
  // SELECT
  //     id,
  //     username,
  //     league,
  //   (case when t.isActive is not null
  //     then 'true'
  //     else 'false'
  //   end) as 'isActive'
  // FROM teams_system.teams as t
  // WHERE
  //     isActive = true
  // `,
  GetUserById: `
      Select * FROM mydb.user WHERE id = ?
  `,

  AddUser: `
  INSERT INTO mydb.user (username, pseudo, email, password, created_at)
    VALUES (?, ?, ?, ?, ?);
  `,
  //   UpdateUserById: `
  //   UPDATE teams_system.teams
  //   SET name = ?,
  //       league = ?
  //   WHERE
  //     id = ?
  //   `,

  //   DeleteUserById: `
  //   UPDATE teams_system.teams
  //   SET isActive = false
  //   WHERE
  //     id = ?
  //   `
};