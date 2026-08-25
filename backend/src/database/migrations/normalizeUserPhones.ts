import { connectDB, disconnectDB } from '../../config/db';
import { AUSTRALIAN_MOBILE_PHONE_REGEX, User } from '../../models/User';
import usersData from '../seeders/users.seed.json';

const normalizePhone = (phone: string): string | null => {
  if (AUSTRALIAN_MOBILE_PHONE_REGEX.test(phone)) return phone;
  if (/^\+614[0-9]{8}$/.test(phone)) return `0${phone.slice(3)}`;
  return null;
};

const migrateUserPhones = async (): Promise<void> => {
  const dryRun = process.env.MIGRATION_DRY_RUN === 'true';
  const seededPhones = new Map(usersData.map((user) => [user.email, user.phone]));
  const invalidPhones: string[] = [];
  let updatedCount = 0;

  try {
    await connectDB();

    const users = await User.find({}, { email: 1, phone: 1 }).lean();

    for (const user of users) {
      const normalizedPhone = normalizePhone(user.phone);
      const seededPhone = seededPhones.get(user.email);
      const targetPhone = normalizedPhone ?? (user.phone.startsWith('+') ? seededPhone : null);

      if (!targetPhone || !AUSTRALIAN_MOBILE_PHONE_REGEX.test(targetPhone)) {
        invalidPhones.push(`${user.email}: ${user.phone}`);
        continue;
      }

      if (targetPhone === user.phone) continue;

      if (!dryRun) {
        await User.updateOne({ _id: user._id }, { $set: { phone: targetPhone } }, { runValidators: true });
      }
      updatedCount += 1;
    }

    if (invalidPhones.length > 0) {
      throw new Error(`Could not normalize phone numbers: ${invalidPhones.join('; ')}`);
    }

    console.log(`${dryRun ? 'Would update' : 'Updated'} ${updatedCount} user phone number(s)`);
  } catch (error) {
    console.error('Failed to normalize user phone numbers:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

migrateUserPhones();