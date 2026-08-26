import assert from 'node:assert/strict';
import { loginUser } from './authService';
import { User } from '../models/User';

(async () => {
  const validUser = {
    _id: 'user-123',
    name: 'Alice Johnson',
    phone: '0412345678',
    email: 'alice.johnson@example.com',
    role: 'member',
    comparePassword: async (candidate: string) => candidate === 'password123',
  };

  const result = await loginUser('0412345678', 'password123', async (phone) =>
    phone === '0412345678' ? (validUser as any) : null
  );

  assert.equal(result.user.name, 'Alice Johnson');
  assert.equal(result.user.role, 'member');
  assert.ok(result.token);

  await assert.rejects(
    () => loginUser('0412345678', 'wrongpassword', async () => validUser as any),
    /Invalid phone number or password/
  );

  await assert.rejects(
    () => loginUser('', 'password123', async () => validUser as any),
    /Phone number and password are required/
  );

  const validPhoneUser = new User({
    name: 'Phone Test',
    phone: '0412345678',
    email: 'phone.test@example.com',
    dob: new Date('1990-01-01'),
    password: 'password123',
    role: 'member',
  });
  await assert.doesNotReject(() => validPhoneUser.validate());

  for (const phone of ['041234567', '04123456789', '0512345678', '+61412345678']) {
    const invalidPhoneUser = new User({ ...validPhoneUser.toObject(), phone });
    await assert.rejects(() => invalidPhoneUser.validate(), /Phone number must be/);
  }

  console.log('Auth service tests passed');
})();
