import {
    ExerciseMuscleGroup,
    ExerciseMuscleGroups,
} from '@dgoudie/isometric-types';
import {
    getExercise,
    getExercises,
    getSchedule,
    saveSchedule,
} from '../repository/repository';

import { ServiceError } from '@dgoudie/service-error';
import express from 'express';

export function init(app: express.Application) {
    app.get('/api/exercises', (req, res, next) => {
        const { search, muscleGroup } = req.query;
        if (typeof search !== 'undefined') {
            if (typeof search !== 'string') {
                res.status(400).send();
                return;
            }
        }
        if (typeof muscleGroup !== 'undefined') {
            if (
                typeof muscleGroup !== 'string' ||
                !ExerciseMuscleGroups.includes(
                    muscleGroup as ExerciseMuscleGroup
                )
            ) {
                res.status(400).send();
                return;
            }
        }
        getExercises(
            res.locals.userId,
            search,
            muscleGroup as ExerciseMuscleGroup
        )
            .then((exercises) => res.send(exercises))
            .catch((e) => next(e));
    });

    app.get('/api/exercise/:name', async (req, res, next) => {
        const name = req.params.name;
        try {
            const exercise = await getExercise(res.locals.userId, name);
            if (!exercise) {
                throw new ServiceError(
                    404,
                    `Exercise with name '${name}' not found.`
                );
            }
            res.send(exercise);
        } catch (e) {
            next(e);
        }
    });

    app.get('/api/schedule', async (req, res, next) => {
        try {
            const schedule = await getSchedule(res.locals.userId);
            res.send(schedule);
        } catch (e) {
            next(e);
        }
    });

    app.put('/api/schedule', async (req, res, next) => {
        try {
            await saveSchedule(res.locals.userId, req.body);
            res.sendStatus(204);
        } catch (e) {
            next(e);
        }
    });
}
