import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import {
  deleteUserById,
  getProfile,
  getSessionByValidToken,
  getUserByUsername,
  getUserByValidSessionToken,
  updateUser,
} from '../../utils/database';

// get the cookie from the request
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  context: GetServerSidePropsContext,
) {
  // getting the user from context

  const user = await getUserByValidSessionToken(
    context.req.cookies.sessionToken,
  );

  if (!user) {
    res.status(400).json({ errors: [{ message: 'No session token passed' }] });
  }

  if (user) {
    const profile = await getProfile(user.id);

    if (!profile) {
      res
        .status(400)
        .json({ errors: [{ message: 'No session token passed' }] });
    }
    if (profile) {
      // checking the method
      if (req.method === 'GET') {
        // 3. return the user
        res.status(200).json({ user: user, profile: profile });
      }

      // if method PUT
      if (req.method === 'PUT') {
        if (
          !user.id ||
          typeof req.body.username !== 'string' ||
          typeof req.body.firstName !== 'string' ||
          typeof req.body.lastName !== 'string' ||
          typeof req.body.email !== 'string' ||
          typeof req.body.selfDescription !== 'string' ||
          !req.body.username ||
          !req.body.firstName ||
          !req.body.lastName ||
          !req.body.email ||
          !req.body.selfDescription
        ) {
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

        // get the user datails
        const request = req.body;
        const username = request.username;
        const firstName = request.firstName;
        const lastName = request.lastName;
        const email = request.email;
        const selfDescription = request.selfDescription;

        if (await getUserByUsername(username)) {
          res
            .status(401)
            .json({ errors: [{ message: 'This username is already taken' }] });
          return;
        }

        const updatedUser = await updateUser(
          user.id,
          username,
          firstName,
          lastName,
          email,
          selfDescription,
        );

        res.status(200).json({ user: updatedUser });
      }

      // if the method delete
      if (req.method === 'DELETE') {
        const deletedUser = await deleteUserById(user.id);

        if (!deletedUser) {
          return res
            .status(400)
            .json({ errors: [{ message: 'Id is not valid' }] });
        }

        return res.status(200).json({ user: deletedUser });
      }

      res.status(405).json({ errors: [{ message: 'Method is not allowed' }] });
    }
  }
}