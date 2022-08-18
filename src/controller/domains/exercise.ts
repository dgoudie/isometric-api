import {
  ExerciseMuscleGroup,
  ExerciseMuscleGroups,
} from '@dgoudie/isometric-types';
import {
  getExerciseByName,
  getExercises,
  saveExercise,
} from '../../database/domains/exercise.js';

import express from 'express';

export function initExercise(app: express.Application) {
  app.get('/api/exercises', (req, res, next) => {
    let {
      search,
      muscleGroup,
      page,
      ids,
      onlyPerformed: onlyPerformedFromQuery,
      onlyNotPerformed: onlyNotPerformedFromQuery,
    } = req.query;
    const onlyPerformed = !!onlyPerformedFromQuery;
    const onlyNotPerformed = !!onlyNotPerformedFromQuery;
    if (typeof search !== 'undefined') {
      if (typeof search !== 'string') {
        res.status(400).send();
        return;
      }
    }
    if (typeof muscleGroup !== 'undefined') {
      if (
        typeof muscleGroup !== 'string' ||
        !ExerciseMuscleGroups.includes(muscleGroup as ExerciseMuscleGroup)
      ) {
        res.status(400).send();
        return;
      }
    }
    if (typeof page !== 'undefined') {
      if (typeof page !== 'string' || isNaN(parseInt(page))) {
        res.status(400).send();
        return;
      }
    }
    if (typeof ids !== 'undefined') {
      if (typeof ids === 'string') {
        ids = [ids];
      }
      ids = ids as string[];
      if (!ids.every((id) => typeof id === 'string')) {
        res.status(400).send();
        return;
      }
    }
    getExercises(
      res.locals.userId,
      {
        search,
        muscleGroup: muscleGroup as ExerciseMuscleGroup,
        ids,
        onlyNotPerformed,
        onlyPerformed,
      },
      !!page ? parseInt(page) : undefined
    )
      .then((exercises) => res.send(exercises))
      .catch((e) => next(e));
  });

  app.get('/api/exercise/:name', async (req, res, next) => {
    const name = req.params.name;
    try {
      const exercise = await getExerciseByName(res.locals.userId, name);
      if (!exercise) {
        res.status(404).send(`Exercise with name '${name}' not found.`);
      } else {
        res.send(exercise);
      }
    } catch (e) {
      next(e);
    }
  });

  app.put('/api/exercise', async (req, res, next) => {
    if (!req.body._id) {
      res.status(400).send();
      return;
    }
    try {
      await saveExercise(res.locals.userId, req.body);
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  });
}
