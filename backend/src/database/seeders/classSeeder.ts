import { connectDB, disconnectDB } from '../../config/db';
import { User } from '../../models/User';
import { FitnessClass } from '../../models/FitnessClass';

const addDays = (days: number, hour: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const seedClasses = async (): Promise<void> => {
  try {
    await connectDB();

    const instructors = await User.find({ role: 'instructor' }).limit(4);

    if (instructors.length === 0) {
      console.log('No instructors found. Run "npm run seed:users" first.');
      return;
    }

    await FitnessClass.deleteMany({});

    const classes = [
      { title: 'Morning HIIT', description: 'High intensity interval training', durationMinutes: 45, capacity: 20, intensity: 5, location: 'Studio A', visibility: 'public' as const, dayOffset: 1, hour: 7 },
      { title: 'Yoga Flow', description: 'Relaxing full-body yoga session', durationMinutes: 60, capacity: 15, intensity: 1, location: 'Studio B', visibility: 'public' as const, dayOffset: 2, hour: 9 },
      { title: 'Strength Training', description: 'Free weights and resistance training', durationMinutes: 50, capacity: 12, intensity: 4, location: 'Weight Room', visibility: 'public' as const, dayOffset: 3, hour: 18 },
      { title: 'Spin Class', description: 'Indoor cycling session', durationMinutes: 40, capacity: 25, intensity: 3, location: 'Studio C', visibility: 'public' as const, dayOffset: 4, hour: 6 },
      { title: 'Instructor Prep Session', description: 'Private planning session', durationMinutes: 30, capacity: 1, intensity: 2, location: 'Office', visibility: 'private' as const, dayOffset: 1, hour: 16 },
    ];

    const docs = classes.map((c, index) => ({
      title: c.title,
      description: c.description,
      instructor: instructors[index % instructors.length]._id,
      scheduledAt: addDays(c.dayOffset, c.hour),
      durationMinutes: c.durationMinutes,
      location: c.location,
      capacity: c.capacity,
      intensity: c.intensity,
      visibility: c.visibility,
      status: 'active' as const,
    }));

    await FitnessClass.insertMany(docs);
    console.log(`Seeded ${docs.length} classes`);
  } catch (error) {
    console.error('Failed to seed classes:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

seedClasses();
