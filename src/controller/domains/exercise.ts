import {
    ExerciseMuscleGroup,
    ExerciseMuscleGroups,
} from '@dgoudie/isometric-types';
import { getExercise, getExercises } from '../../database/domains/exercise';

import express from 'express';

export function initExercise(app: express.Application) {
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
                res.status(404).send(`Exercise with name '${name}' not found.`);
            } else {
                res.send(exercise);
            }
        } catch (e) {
            next(e);
        }
    });
}
