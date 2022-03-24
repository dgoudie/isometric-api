export const buildNextDayScheduleAggregation = (nextDayNumber: number) => {
    let pipeline: object[] = [];
    pipeline = [
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
                        dayNumber: nextDayNumber,
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
    ];
    return pipeline;
};

// export const buildBeerOrLiquorBrandsByTypeAggregation = (
//   onlyShowInStock: boolean,
//   onlyOutOfStock: boolean,
//   filterText?: string
// ) => {
//   let pipeline: object[] = [];
//   if (onlyShowInStock) {
//     pipeline = [...pipeline, { $match: { inStock: true } }];
//   }
//   if (onlyOutOfStock) {
//     pipeline = [...pipeline, { $match: { inStock: false } }];
//   }
//   if (!!filterText) {
//     pipeline = [
//       ...pipeline,
//       {
//         $match: { $expr: buildAndQueryForText(filterText, '$nameNormalized') },
//       },
//     ];
//   }
//   pipeline = [
//     ...pipeline,
//     {
//       $project: {
//         type: 1,
//         temp: {
//           _id: '$_id',
//           name: '$name',
//           nameNormalized: '$nameNormalized',
//           inStock: '$inStock',
//           price: '$price',
//           type: '$type',
//         },
//       },
//     },
//     {
//       $sort: {
//         type: 1,
//         'temp.name': 1,
//       },
//     },
//     {
//       $group: {
//         _id: '$type',
//         items: {
//           $push: '$temp',
//         },
//       },
//     },
//     {
//       $project: {
//         type: '$_id',
//         items: '$items',
//       },
//     },
//     {
//       $sort: {
//         type: 1,
//       },
//     },
//     {
//       $unset: '_id',
//     },
//   ];
//   return pipeline;
// };

// export const buildMixedDrinkRecipesWithIngredientsAggregation = (
//   onlyShowItemsWithAllIngedientsInStock: boolean,
//   filterText?: string
// ) => {
//   let pipeline: object[] = [
//     {
//       $lookup: {
//         from: properties.mongodbBeerOrLiquorBrandsCollectionName,
//         localField: 'requiredBeersOrLiquors._id',
//         foreignField: '_id',
//         as: 'requiredBeersOrLiquorsWithDetail',
//       },
//     },
//     {
//       $addFields: {
//         requiredBeersOrLiquors: {
//           $map: {
//             input: '$requiredBeersOrLiquorsWithDetail',
//             as: 'r',
//             in: {
//               _id: '$$r._id',
//               name: '$$r.name',
//               nameNormalized: '$$r.nameNormalized',
//               additionalNotes: '$$r.additionalNotes',
//               inStock: '$$r.inStock',
//               price: '$$r.price',
//               count: {
//                 $arrayElemAt: [
//                   '$requiredBeersOrLiquors.count',
//                   {
//                     $indexOfArray: ['$requiredBeersOrLiquors._id', '$$r._id'],
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//     },
//   ];
//   if (!!onlyShowItemsWithAllIngedientsInStock) {
//     pipeline = [
//       ...pipeline,
//       {
//         $match: {
//           requiredBeersOrLiquors: {
//             $not: {
//               $elemMatch: {
//                 inStock: false,
//               },
//             },
//           },
//         },
//       },
//     ];
//   }
//   pipeline = [
//     ...pipeline,
//     {
//       $addFields: {
//         requiredBeersOrLiquors: {
//           $map: {
//             input: '$requiredBeersOrLiquors',
//             as: 'row',
//             in: {
//               _id: '$$row._id',
//               name: '$$row.name',
//               inStock: '$$row.inStock',
//               price: '$$row.price',
//               count: '$$row.count',
//               nameNormalized: '$$row.nameNormalized',
//               additionalNotes: '$$row.additionalNotes',
//               calculatedPrice: {
//                 $multiply: ['$$row.price', '$$row.count'],
//               },
//             },
//           },
//         },
//       },
//     },
//   ];
//   if (!!filterText) {
//     pipeline = [
//       ...pipeline,
//       {
//         $addFields: {
//           requiredBeersOrLiquors: {
//             $map: {
//               input: '$requiredBeersOrLiquors',
//               as: 'row',
//               in: {
//                 _id: '$$row._id',
//                 name: '$$row.name',
//                 inStock: '$$row.inStock',
//                 price: '$$row.price',
//                 count: '$$row.count',
//                 nameNormalized: '$$row.nameNormalized',
//                 additionalNotes: '$$row.additionalNotes',
//                 calculatedPrice: '$$row.calculatedPrice',
//                 nameMatch: buildAndQueryForText(
//                   filterText,
//                   '$$row.nameNormalized'
//                 ),
//               },
//             },
//           },
//         },
//       },
//     ];
//   }
//   pipeline = [
//     ...pipeline,
//     {
//       $addFields: {
//         price: {
//           $divide: [
//             {
//               $round: {
//                 $multiply: [
//                   { $sum: '$requiredBeersOrLiquors.calculatedPrice' },
//                   2,
//                 ],
//               },
//             },
//             2,
//           ],
//         },
//       },
//     },
//   ];
//   if (!!filterText) {
//     pipeline = [
//       ...pipeline,
//       {
//         $match: {
//           $or: [
//             {
//               $expr: buildAndQueryForText(filterText, '$nameNormalized'),
//             },
//             {
//               requiredBeersOrLiquors: {
//                 $elemMatch: {
//                   nameMatch: true,
//                 },
//               },
//             },
//           ],
//         },
//       },
//     ];
//   }
//   pipeline = [
//     ...pipeline,
//     {
//       $unset: [
//         'requiredBeersOrLiquors.calculatedPrice',
//         'requiredBeersOrLiquors.nameMatch',
//         'requiredBeersOrLiquorsWithDetail',
//       ],
//     },
//     {
//       $sort: { nameNormalized: 1 },
//     },
//   ];
//   return pipeline;
// };

// const buildAndQueryForText = (
//   text: string,
//   argName: string
// ): { $and: { $function: any }[] } => {
//   const tokenizedText = text.toLowerCase().replace(/\//g, '\\').split(' ');
//   return {
//     $and: tokenizedText.map<{ $function: any }>((token) => ({
//       $function: {
//         body: `function(text) { return text.includes("${token}")}`,
//         args: [argName],
//         lang: 'js',
//       },
//     })),
//   };
// };
