import {
    ExerciseMuscleGroup,
    ExerciseMuscleGroups,
} from '@dgoudie/isometric-types';
import { getExercise, getExercises } from '../repository/repository';

import { ServiceError } from '@dgoudie/service-error';
import express from 'express';

export function init(app: express.Application) {
    app.get('/api/exercises', (req, res, next) => {
        const { q, muscleGroup } = req.query;
        if (typeof q !== 'undefined') {
            if (typeof q !== 'string') {
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
        getExercises(res.locals.userId, q, muscleGroup as ExerciseMuscleGroup)
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
}
