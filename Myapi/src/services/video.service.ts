import { User, Video, VideoDbResponse, ListResponse } from "~~/types/resources";
import { execute } from "~/utils/mysql.connector";
import { pagination } from "~~/types/request";
import { ResultSetHeader } from "mysql2";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";

export async function createOne(name: string, videoFile: Express.Multer.File, user: User): Promise<Video> {

  let duration = 0;
  try {
    const videoInfos = await ffprobe(videoFile.path, { path: ffprobeStatic.path })
    if (videoInfos.streams && videoInfos.streams.length > 0 && videoInfos.streams[0].duration) {
      duration = Math.round(videoInfos.streams[0].duration);
    }
  } catch (e) {
    console.error(e);
  }
  const dbResponse = await execute<ResultSetHeader>('INSERT INTO video (name, duration, user_id, source) VALUES (?,?,?,?)', [name, duration || 0, user.id, videoFile.path]);
  return {
    id: dbResponse.insertId,
    name,
    source: videoFile.path,
    created_at: new Date(),
    views: 0,
    enabled: true,
    user,
    formats: {
      "1080": null,
      "720": null,
      "480": null,
      "360": null,
      "240": null,
      "144": null,
    }
  };
}

export async function findAll(name: string | null, user: string | null | number, duration: number | null, pagination: pagination): Promise<ListResponse<Video>> {
  const query = `SELECT video.id, video.name, video.source, video.created_at, video.view, video.enabled, video.user_id, user.username, user.pseudo, user.created_at as 'user_created_at', video.format_1080, video.format_720, video.format_480, video.format_360, video.format_240, video.format_144 FROM video LEFT JOIN user ON video.user_id = user.id WHERE 1=1`;
  const queryParams: string[] = [];
  let countQuery = `SELECT COUNT(*) as 'total' FROM video LEFT JOIN user ON video.user_id = user.id WHERE 1=1`;
  if (name) {
    queryParams.push(` AND video.name LIKE '%${name}%'`);
  }
  if (user) {
    if (typeof user === 'string') {
      queryParams.push(` AND user.pseudo LIKE '%${user}%'`);
    } else {
      queryParams.push(` AND video.user_id = ${user}`);
    }
  }
  if (duration) {
    queryParams.push(` AND video.duration <= ${duration}`);
  }
  const videos = await execute<VideoDbResponse[]>(query + queryParams.join() + ` ORDER BY video.id DESC` + ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`, []);
  return {
    items: videos.map(formatVideoDbResponse),
    total: (await execute<{ total: number }[]>(countQuery + queryParams.join(), []))[0].total
  };
}
export async function updateOne(name: string | null, newOwnerId: number | null, ownerId: number, videoId: number): Promise<Video> {
  const query = `UPDATE video SET`;
  const queryParams: string[] = [];
  if (name) {
    queryParams.push(` name = '${name}'`);
  }
  if (newOwnerId) {
    queryParams.push(` user_id = ${newOwnerId}`);
  }
  const updateResult = await execute<ResultSetHeader>(query + queryParams.join() + ` WHERE id=${videoId} AND user_id=${ownerId}`, []);
  if (updateResult.affectedRows === 0) {
    throw new Error('Video not found or you don\'t have the permission to update it');
  }
  const video = await findOne(videoId);
  if (!video) {
    throw new Error('Video not found');
  }
  return video;
}

export async function deleteOne(id: number, ownerId: number) {
  const deleteResults = await execute<ResultSetHeader>("DELETE FROM video WHERE id = ? AND user_id = ?", [id, ownerId])
  if (deleteResults.affectedRows === 0) {
    throw new Error('Video not found or you don\'t have the permission to delete it');
  }
}

export async function findOne(id: number): Promise<Video | null> {
  const query = `SELECT video.id, video.name, video.source, video.created_at, video.view, video.enabled, video.user_id, user.username, user.pseudo, user.created_at as 'user_created_at', video.format_1080, video.format_720, video.format_480, video.format_360, video.format_240, video.format_144 FROM video LEFT JOIN user ON video.user_id = user.id WHERE 1=1`;
  const videos = await execute<VideoDbResponse[]>(query + ` AND video.id = ${id}`, []);
  if (videos.length === 0) {
    return null;
  }
  return formatVideoDbResponse(videos[0]);
}

export async function addEncodingOne(format: string, file: string, id: number): Promise<Video> {
  const query = `UPDATE video SET format_${format} = '${file}' WHERE id=${id}`;
  const updateResult = await execute<ResultSetHeader>(query, []);
  if (updateResult.affectedRows === 0) {
    throw new Error('Video not found');
  }
  const video = await findOne(id);
  if (!video) {
    throw new Error('Video not found');
  }
  return video;
}

function hidePrivateProperties(user: User) {
  delete user.email;
  return user;
}

function formatVideoDbResponse(videoDbResponse: VideoDbResponse): Video {
  return {
    id: videoDbResponse.id,
    name: videoDbResponse.name,
    source: videoDbResponse.source,
    created_at: videoDbResponse.created_at,
    views: videoDbResponse.view,
    enabled: videoDbResponse.enabled === 1,
    user: {
      id: videoDbResponse.user_id,
      username: videoDbResponse.username,
      pseudo: videoDbResponse.pseudo,
      createdAt: videoDbResponse.user_created_at,
    },
    formats: {
      "1080": videoDbResponse.format_1080,
      "720": videoDbResponse.format_720,
      "480": videoDbResponse.format_480,
      "360": videoDbResponse.format_360,
      "240": videoDbResponse.format_240,
      "144": videoDbResponse.format_144,
    }
  }
}