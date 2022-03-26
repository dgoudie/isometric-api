import { ISchedule, IScheduleDayWithExercises } from '@dgoudie/isometric-types';
import mongoose, { PipelineStage } from 'mongoose';

import WorkoutSchedule from '../models/schedule';

export function getSchedule(userId: string) {
    return WorkoutSchedule.findOne({ userId });
}

export function saveSchedule(userId: string, schedule: ISchedule) {
    return WorkoutSchedule.updateOne(
        { userId },
        { ...schedule, userId },
        { upsert: true }
    );
}

export async function getNextDaySchedule(userId: string) {
    // TODO get next day number from workouts collection

    const [day] = await WorkoutSchedule.aggregate<IScheduleDayWithExercises>(
        buildNextDayScheduleAggregation(userId, 0)
    );
    return day;
}

const buildNextDayScheduleAggregation = (userId: string, dayNumber: number) => {
    let pipeline: PipelineStage[] = [];
    pipeline = [
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $addFields: {
                dayCount: {
                    $size: '$days',
                },
            },
        },
        {
            $unwind: {
                path: '$days',
                includeArrayIndex: 'dayNumber',
            },
        },
        {
            $project: {
                _id: '$days._id',
                nickname: '$days.nickname',
                exercises: '$days.exercises',
                dayCount: '$dayCount',
                dayNumber: '$dayNumber',
            },
        },
        {
            $match: {
                $or: [
                    {
                        dayNumber,
                    },
                    {
                        dayNumber: 0,
                    },
                ],
            },
        },
        {
            $sort: {
                dayNumber: -1,
            },
        },
        {
            $limit: 1,
        },
        {
            $unwind: {
                path: '$exercises',
                includeArrayIndex: 'index',
            },
        },
        {
            $lookup: {
                from: 'exercises',
                localField: 'exercises',
                foreignField: '_id',
                as: 'exercises',
            },
        },
        {
            $set: {
                exercises: {
                    $arrayElemAt: ['$exercises', 0],
                },
            },
        },
        {
            $group: {
                _id: '$_id',
                nickname: {
                    $first: '$nickname',
                },
                dayNumber: {
                    $first: '$dayNumber',
                },
                dayCount: {
                    $first: '$dayCount',
                },
                exercises: {
                    $push: '$exercises',
                },
            },
        },
    ];
    return pipeline;
};
