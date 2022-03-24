import {
    IExercise,
    IWorkoutSchedule,
    IWorkoutScheduleDay,
} from '@dgoudie/isometric-types';

import { PipelineStage } from 'mongoose';
import WorkoutSchedule from '../models/workout-schedule';
import mongoose from 'mongoose';

export function getSchedule(userId: string) {
    return WorkoutSchedule.findOne({ userId });
}

export function saveSchedule(userId: string, schedule: IWorkoutSchedule) {
    return WorkoutSchedule.updateOne(
        { userId },
        { ...schedule, userId },
        { upsert: true }
    );
}

export async function getNextDaySchedule(userId: string) {
    // TODO get next day number from workouts collection

    const [day] = await WorkoutSchedule.aggregate<
        IWorkoutScheduleDay & { exercises: IExercise[] }
    >(buildNextDayScheduleAggregation(userId, 0));
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
            $unset: 'dayNumber',
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
                exercises: {
                    $push: '$exercises',
                },
            },
        },
    ];
    return pipeline;
};
