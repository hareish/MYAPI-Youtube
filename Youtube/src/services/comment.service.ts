import { Comment, User } from "~~/types/resources";
import { execute } from "~/utils/mysql.connector";
import { pagination } from "~~/types/request";
import { ResultSetHeader } from "mysql2";

export async function createOne(videoId: number, user: User, body: string): Promise<Comment> {
    const dbResult = await execute<ResultSetHeader>(`INSERT INTO mydb.comment (body, user_id, video_id) VALUES (?, ?, ?)`, [
            body,
            user.id,
            videoId
        ]
    )

    return {
        id: dbResult.insertId,
        body,
        user
    };
}

export async function listAll(pagination: pagination) {
  const query = `SELECT * FROM comment WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) as 'total' FROM comment WHERE 1=1`;
  const comments = await execute<Comment[]>(query + ` ORDER BY id DESC`+ ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`, []);
  return {
    items: comments,
    total: (await execute<{ total: number }[]>(countQuery, []))[0].total
  };
} 