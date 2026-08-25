import { connectDB, disconnectDB } from '../../config/db';
import { User } from '../../models/User';
import usersData from './users.seed.json';

const seedUsers = async (): Promise<void> => {
  try {
    await connectDB();

    const emails = usersData.map((u) => u.email);
    await User.deleteMany({ email: { $in: emails } });

    const users = usersData.map((u) => ({ ...u, dob: new Date(u.dob) }));
    // insertMany skips document middleware, so use create() to trigger password hashing
    await User.create(users);

    console.log(`Seeded ${users.length} users`);
  } catch (error) {
    console.error('Failed to seed users:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

seedUsers();
