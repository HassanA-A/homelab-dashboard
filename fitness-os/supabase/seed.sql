-- Built-in exercise library (user_id null = visible to every user, editable by none).
insert into public.exercises (user_id, name, category, primary_muscle, secondary_muscles, equipment) values
  (null, 'Bench Press',            'compound',  'chest',      '{triceps,front_delts}', 'barbell'),
  (null, 'Incline Bench Press',    'compound',  'chest',      '{front_delts,triceps}', 'barbell'),
  (null, 'Incline Dumbbell Press', 'compound',  'chest',      '{front_delts,triceps}', 'dumbbell'),
  (null, 'Squat',                  'compound',  'quads',      '{glutes,adductors}',    'barbell'),
  (null, 'Hack Squat',             'compound',  'quads',      '{glutes}',              'machine'),
  (null, 'Leg Press',              'compound',  'quads',      '{glutes}',              'machine'),
  (null, 'Romanian Deadlift',      'compound',  'hamstrings', '{glutes,lower_back}',   'barbell'),
  (null, 'Deadlift',               'compound',  'hamstrings', '{glutes,lower_back,traps}', 'barbell'),
  (null, 'Lat Pulldown',           'compound',  'lats',       '{biceps,rear_delts}',   'cable'),
  (null, 'Pull-up',                'compound',  'lats',       '{biceps}',              'bodyweight'),
  (null, 'Barbell Row',            'compound',  'upper_back', '{lats,biceps}',         'barbell'),
  (null, 'Seated Cable Row',       'compound',  'upper_back', '{lats,biceps}',         'cable'),
  (null, 'Chest-Supported Row',    'compound',  'upper_back', '{lats,rear_delts}',     'machine'),
  (null, 'Shoulder Press',         'compound',  'front_delts','{triceps,side_delts}',  'dumbbell'),
  (null, 'Lateral Raise',          'isolation', 'side_delts', '{}',                    'dumbbell'),
  (null, 'Leg Extension',          'isolation', 'quads',      '{}',                    'machine'),
  (null, 'Leg Curl',               'isolation', 'hamstrings', '{}',                    'machine'),
  (null, 'Calf Raise',             'isolation', 'calves',     '{}',                    'machine'),
  (null, 'Bicep Curl',             'isolation', 'biceps',     '{}',                    'dumbbell'),
  (null, 'Triceps Pushdown',       'isolation', 'triceps',    '{}',                    'cable'),
  (null, 'Cable Fly',              'isolation', 'chest',      '{}',                    'cable')
on conflict do nothing;
