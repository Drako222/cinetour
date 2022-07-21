import { NextApiRequest, NextApiResponse } from 'next';
import {
  createFriend,
  deleteFriendById,
  getFriends,
  getSessionByValidToken,
} from '../../../utils/database';

// get the cookie from the request
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // getting the user from query

  const userId = Number(req.query.userId);
  if (!userId || typeof userId !== 'number') {
    return res.status(400).json({ errors: [{ message: 'No User' }] });
  }

  // checking the method
  if (req.method === 'GET') {
    const friends = await getFriends(userId);

    if (!friends) {
      return res
        .status(400)
        .json({ errors: [{ message: 'No session token passed' }] });
    }

    return res.status(200).json(friends);
  }

  //  if method POST
  if (req.method === 'POST') {
    if (typeof req.body.friendId !== 'number' || !req.body.friendId) {
      return res
        .status(400)
        .json({ errors: [{ message: 'No user available' }] });
    }

    // authentication
    const sessionToken = req.cookies.sessionToken;

    const session = await getSessionByValidToken(sessionToken);

    if (!session) {
      return res.status(403).json({ errors: [{ message: 'Unauthorize' }] });
    }

    // the action

    const friendship = await createFriend(userId, req.body.friendId);
    if (!friendship) {
      return res
        .status(400)
        .json({ errors: [{ message: 'No session token passed' }] });
    }

    return res.status(200).json(friendship);
  }

  if (req.method === 'DELETE') {
    if (typeof req.body.friendId !== 'number' || !req.body.friendId) {
      return res.status(400).json({
        errors: [{ message: 'Please, provide all required data' }],
      });
    }

    // authentication
    const sessionToken = req.cookies.sessionToken;

    const session = await getSessionByValidToken(sessionToken);

    if (!session) {
      return res.status(403).json({ errors: [{ message: 'Unauthorize' }] });
    }

    // the action

    const deletedFriend = await deleteFriendById(userId, req.body.friendId);

    if (deletedFriend) {
      return res.status(200).json(deletedFriend);
    }
  }

  return res
    .status(405)
    .json({ errors: [{ message: 'Method is not allowed' }] });
}
