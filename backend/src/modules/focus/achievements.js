export const ACHIEVEMENTS = [
  {
    id: "first_light", emoji: "🌅", tier: "bronze", xp: 50, hidden: false,
    name: "First Light", desc: "Complete your first focus session",
    rule: { type: "stat", metric: "totalSessions", gte: 1 },
    triggers: ["session.completed"],
  },
  {
    id: "the_contract", emoji: "🤝", tier: "bronze", xp: 75, hidden: false,
    name: "The Contract", desc: "Complete 3 focus sessions",
    rule: { type: "stat", metric: "totalSessions", gte: 3 },
    triggers: ["session.completed"],
  },
  {
    id: "enrolled", emoji: "📋", tier: "bronze", xp: 40, hidden: false,
    name: "Enrolled", desc: "Add your first course",
    rule: { type: "course_count", gte: 1 },
    triggers: ["course.created"],
  },
  {
    id: "on_the_record", emoji: "📝", tier: "bronze", xp: 40, hidden: false,
    name: "On the Record", desc: "Create your first evaluation",
    rule: { type: "eval_count", gte: 1 },
    triggers: ["eval.created"],
  },
  {
    id: "marked", emoji: "✅", tier: "bronze", xp: 50, hidden: false,
    name: "Marked", desc: "Enter your first evaluation score",
    rule: { type: "event_count", eventType: "eval.score_entered", gte: 1 },
    triggers: ["eval.score_entered"],
  },
  {
    id: "first_order", emoji: "🗒️", tier: "bronze", xp: 30, hidden: false,
    name: "First Order", desc: "Create your first task",
    rule: { type: "event_count", eventType: "task.created", gte: 1 },
    triggers: ["task.created"],
  },
  {
    id: "full_picture", emoji: "📊", tier: "bronze", xp: 25, hidden: false,
    name: "Full Picture", desc: "Open the Progress page for the first time",
    rule: { type: "event_count", eventType: "page.progress_visited", gte: 1 },
    triggers: ["page.progress_visited"],
  },
  {
    id: "system_online", emoji: "🔗", tier: "bronze", xp: 60, hidden: false,
    name: "System Online", desc: "Complete a focus session linked to a task or evaluation",
    rule: { type: "event_count", eventType: "session.linked_completed", gte: 1 },
    triggers: ["session.linked_completed"],
  },

  {
    id: "kindling", emoji: "🔥", tier: "bronze", xp: 60, hidden: false,
    name: "Kindling", desc: "Reach a 3-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 3 },
    triggers: ["session.completed"],
  },
  {
    id: "ritual", emoji: "⚡", tier: "silver", xp: 150, hidden: false,
    name: "Ritual", desc: "Reach a 14-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 14 },
    triggers: ["session.completed"],
  },
  {
    id: "no_days_off", emoji: "📅", tier: "silver", xp: 250, hidden: false,
    name: "No Days Off", desc: "Reach a 30-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 30 },
    triggers: ["session.completed"],
  },
  {
    id: "unbroken", emoji: "🧱", tier: "gold", xp: 500, hidden: false,
    name: "Unbroken", desc: "Reach a 60-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 60 },
    triggers: ["session.completed"],
  },
  {
    id: "the_iron_standard", emoji: "⚙️", tier: "platinum", xp: 1000, hidden: false,
    name: "The Iron Standard", desc: "Reach a 100-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 100 },
    triggers: ["session.completed"],
  },
  {
    id: "weekly_anchor", emoji: "⚓", tier: "silver", xp: 200, hidden: false,
    name: "Weekly Anchor", desc: "Study at least once every week for 8 consecutive weeks",
    rule: { type: "weekly_sessions", weeks: 8 },
    triggers: ["session.completed"],
  },
  {
    id: "clockwork", emoji: "🕐", tier: "silver", xp: 175, hidden: false,
    name: "Clockwork", desc: "Study in the same 2-hour window for 10 consecutive days",
    rule: { type: "same_window_days", days: 10 },
    triggers: ["session.completed"],
  },
  {
    id: "daily_driver", emoji: "🎯", tier: "silver", xp: 200, hidden: false,
    name: "Daily Driver", desc: "Complete at least one daily goal every day for 14 days straight",
    rule: { type: "goal_days", days: 14 },
    triggers: ["goal.completed", "session.completed"],
  },
  {
    id: "perfect_briefing", emoji: "🗂️", tier: "gold", xp: 400, hidden: false,
    name: "Perfect Briefing", desc: "Complete all daily goals for 7 consecutive days",
    rule: { type: "all_goals_days", days: 7 },
    triggers: ["goal.completed", "session.completed"],
  },

  {
    id: "flow_state", emoji: "🧠", tier: "silver", xp: 200, hidden: false,
    name: "Flow State", desc: "Complete a 90-minute session with integrity >= 0.85",
    rule: { type: "session_meta", check: "long_high_integrity", minMinutes: 90, minIntegrity: 0.85 },
    triggers: ["session.completed"],
  },
  {
    id: "signal_noise", emoji: "📡", tier: "silver", xp: 175, hidden: false,
    name: "Signal/Noise", desc: "Complete 5 sessions with integrity >= 0.9",
    rule: { type: "high_integrity_sessions", count: 5, minIntegrity: 0.9 },
    triggers: ["session.completed"],
  },
  {
    id: "the_monolith", emoji: "🗿", tier: "gold", xp: 350, hidden: false,
    name: "The Monolith", desc: "Complete a single 3-hour focus session",
    rule: { type: "session_meta", check: "single_session_duration", minMinutes: 180 },
    triggers: ["session.completed"],
  },
  {
    id: "surgeons_hours", emoji: "🔬", tier: "gold", xp: 400, hidden: false,
    name: "Surgeon's Hours", desc: "Complete 10 sessions each with integrity >= 0.9",
    rule: { type: "high_integrity_sessions", count: 10, minIntegrity: 0.9 },
    triggers: ["session.completed"],
  },
  {
    id: "the_depth_protocol", emoji: "🌊", tier: "platinum", xp: 750, hidden: false,
    name: "The Depth Protocol", desc: "Log 50 hours of high-integrity work (integrity >= 0.8)",
    rule: { type: "deep_work_hours", hours: 50, minIntegrity: 0.8 },
    triggers: ["session.completed"],
  },
  {
    id: "traceable", emoji: "🔎", tier: "silver", xp: 225, hidden: false,
    name: "Traceable", desc: "Link every session to a task or eval for 14 consecutive days",
    rule: { type: "linked_sessions_streak", days: 14 },
    triggers: ["session.linked_completed"],
  },
  {
    id: "the_compound", emoji: "📈", tier: "gold", xp: 400, hidden: false,
    name: "The Compound", desc: "Complete 200 total focus sessions",
    rule: { type: "stat", metric: "totalSessions", gte: 200 },
    triggers: ["session.completed"],
  },

  {
    id: "the_setup", emoji: "🎯", tier: "bronze", xp: 75, hidden: false,
    name: "The Setup", desc: "Study for an evaluation at least 72h before its deadline",
    rule: { type: "session_before_eval", hoursAhead: 72 },
    triggers: ["session.completed"],
  },
  {
    id: "above_target", emoji: "🏹", tier: "silver", xp: 150, hidden: false,
    name: "Above Target", desc: "Score above your target grade on any evaluation",
    rule: { type: "eval_above_target" },
    triggers: ["eval.score_entered"],
  },
  {
    id: "holding_the_line", emoji: "🛡️", tier: "silver", xp: 250, hidden: false,
    name: "Holding the Line", desc: "Beat your target grade on 3 consecutive evaluations in one course",
    rule: { type: "eval_consecutive_above_target", count: 3 },
    triggers: ["eval.score_entered"],
  },
  {
    id: "course_complete", emoji: "📚", tier: "silver", xp: 200, hidden: false,
    name: "Course Complete", desc: "Enter scores for every evaluation in a course",
    rule: { type: "all_evals_scored_in_course" },
    triggers: ["eval.score_entered"],
  },
  {
    id: "clean_sheet", emoji: "✨", tier: "gold", xp: 400, hidden: false,
    name: "Clean Sheet", desc: "Score above target on every evaluation in a course",
    rule: { type: "all_evals_above_target_in_course" },
    triggers: ["eval.score_entered"],
  },
  {
    id: "on_track", emoji: "📊", tier: "bronze", xp: 80, hidden: false,
    name: "On Track", desc: "Maintain a course average at or above your target grade",
    rule: { type: "course_above_target" },
    triggers: ["eval.score_entered"],
  },
  {
    id: "no_surprises", emoji: "🗓️", tier: "silver", xp: 125, hidden: false,
    name: "No Surprises", desc: "Study for an eval at least 72 hours before it is due",
    rule: { type: "session_before_eval", hoursAhead: 72 },
    triggers: ["session.completed"],
  },
  {
    id: "the_standard", emoji: "🌟", tier: "gold", xp: 500, hidden: false,
    name: "The Standard", desc: "Keep every active course at or above its target grade simultaneously",
    rule: { type: "all_courses_above_target" },
    triggers: ["eval.score_entered"],
  },

  {
    id: "the_curriculum", emoji: "🗂️", tier: "bronze", xp: 60, hidden: false,
    name: "The Curriculum", desc: "Add 3 or more courses",
    rule: { type: "course_count", gte: 3 },
    triggers: ["course.created"],
  },
  {
    id: "course_closed", emoji: "🔒", tier: "silver", xp: 150, hidden: false,
    name: "Course Closed", desc: "Archive your first completed course",
    rule: { type: "archive_count", gte: 1 },
    triggers: ["course.archived"],
  },
  {
    id: "no_loose_ends", emoji: "🧵", tier: "silver", xp: 150, hidden: false,
    name: "No Loose Ends", desc: "Add at least one weighted evaluation to every active course",
    rule: { type: "all_courses_have_evals" },
    triggers: ["eval.created", "course.created"],
  },
  {
    id: "architect", emoji: "📐", tier: "silver", xp: 175, hidden: false,
    name: "Architect", desc: "Fully configure every active course (name, target grade, 2+ evals)",
    rule: { type: "all_courses_configured" },
    triggers: ["eval.created", "course.created", "course.updated"],
  },
  {
    id: "the_blueprint", emoji: "🏗️", tier: "gold", xp: 300, hidden: false,
    name: "The Blueprint", desc: "Configure all courses and evals before logging your first session of the semester",
    rule: { type: "event_count", eventType: "achievement.blueprint_qualified", gte: 1 },
    triggers: ["achievement.blueprint_qualified"],
  },
  {
    id: "self_aware", emoji: "🎯", tier: "bronze", xp: 50, hidden: false,
    name: "Self-Aware", desc: "Set target grades for all active courses",
    rule: { type: "target_grade_set_all" },
    triggers: ["course.created", "course.updated"],
  },
  {
    id: "fully_loaded", emoji: "💯", tier: "silver", xp: 125, hidden: false,
    name: "Fully Loaded", desc: "Make evaluations in a course total exactly 100% weightage",
    rule: { type: "evals_total_100" },
    triggers: ["eval.created", "eval.updated"],
  },

  {
    id: "scar_tissue", emoji: "🩹", tier: "silver", xp: 150, hidden: false,
    name: "Scar Tissue", desc: "Return after 5+ days of inactivity",
    rule: { type: "comeback", inactiveDays: 5 },
    triggers: ["session.completed"],
  },
  {
    id: "still_here", emoji: "👋", tier: "bronze", xp: 75, hidden: false,
    name: "Still Here", desc: "Return after a 7-day break",
    rule: { type: "comeback", inactiveDays: 7 },
    triggers: ["session.completed"],
  },
  {
    id: "phoenix_protocol", emoji: "🔥", tier: "gold", xp: 350, hidden: false,
    name: "Phoenix Protocol", desc: "Build a 14-day streak after previously breaking a streak of 21+",
    rule: { type: "event_count", eventType: "achievement.phoenix_qualified", gte: 1 },
    triggers: ["achievement.phoenix_qualified"],
  },
  {
    id: "resilience_index", emoji: "💪", tier: "gold", xp: 300, hidden: false,
    name: "Resilience Index", desc: "Return from a 3+ day gap on 3 separate occasions",
    rule: { type: "event_count", eventType: "session.comeback", gte: 3 },
    triggers: ["session.comeback"],
  },
  {
    id: "rebuilt", emoji: "🏛️", tier: "gold", xp: 450, hidden: false,
    name: "Rebuilt", desc: "Reach a 21-day streak after previously breaking one of 21+",
    rule: { type: "event_count", eventType: "achievement.rebuilt_qualified", gte: 1 },
    triggers: ["achievement.rebuilt_qualified"],
  },

  {
    id: "ghost_protocol", emoji: "👁️", tier: "silver", xp: 100, hidden: true,
    name: "Ghost Protocol", desc: "Complete a session between 1AM and 4AM",
    rule: { type: "session_meta", check: "hour_range", hourGte: 1, hourLt: 4 },
    triggers: ["session.completed"],
  },
  {
    id: "the_obsessive", emoji: "🌀", tier: "gold", xp: 250, hidden: true,
    name: "The Obsessive", desc: "Complete 5 focus sessions in a single day",
    rule: { type: "session_meta", check: "five_sessions_today" },
    triggers: ["session.completed"],
  },
  {
    id: "lore_keeper", emoji: "🗝️", tier: "bronze", xp: 30, hidden: true,
    name: "Lore Keeper", desc: "Explore the deeper parts of the app",
    rule: { type: "event_count", eventType: "page.settings_visited", gte: 3 },
    triggers: ["page.settings_visited"],
  },
  {
    id: "overachiever", emoji: "🚀", tier: "gold", xp: 350, hidden: true,
    name: "Overachiever", desc: "Complete every daily goal for 14 consecutive days",
    rule: { type: "all_goals_days", days: 14 },
    triggers: ["goal.completed", "session.completed"],
  },
  {
    id: "spite_mode", emoji: "😤", tier: "gold", xp: 300, hidden: true,
    name: "Spite Mode", desc: "Lock in with a focus session within 24h of a failed evaluation",
    rule: { type: "event_count", eventType: "achievement.spite_mode_qualified", gte: 1 },
    triggers: ["achievement.spite_mode_qualified"],
  },
  {
    id: "the_pre_mortem", emoji: "🔮", tier: "silver", xp: 100, hidden: true,
    name: "The Pre-Mortem", desc: "Start a session linked to an eval on the same day the eval was created",
    rule: { type: "event_count", eventType: "achievement.pre_mortem_qualified", gte: 1 },
    triggers: ["achievement.pre_mortem_qualified"],
  },
  {
    id: "no_backlog", emoji: "🧹", tier: "gold", xp: 275, hidden: true,
    name: "No Backlog", desc: "Complete 10 or more tasks within a 48-hour window",
    rule: { type: "event_count", eventType: "achievement.no_backlog_qualified", gte: 1 },
    triggers: ["achievement.no_backlog_qualified"],
  },
  {
    id: "both_barrels", emoji: "⚡", tier: "gold", xp: 300, hidden: true,
    name: "Both Barrels", desc: "Study before 8AM and after 9PM on the same day",
    rule: { type: "event_count", eventType: "achievement.both_barrels_qualified", gte: 1 },
    triggers: ["achievement.both_barrels_qualified"],
  },
  {
    id: "panic_mode", emoji: "😰", tier: "bronze", xp: 40, hidden: true,
    name: "Panic Mode", desc: "Create an evaluation due within 24 hours",
    rule: { type: "event_count", eventType: "achievement.panic_mode_qualified", gte: 1 },
    triggers: ["achievement.panic_mode_qualified"],
  },
  {
    id: "retroactive", emoji: "⏮️", tier: "bronze", xp: 30, hidden: true,
    name: "Retroactive", desc: "Enter a score for an evaluation that happened over a week ago",
    rule: { type: "event_count", eventType: "achievement.retroactive_qualified", gte: 1 },
    triggers: ["achievement.retroactive_qualified"],
  },
  {
    id: "revisionist", emoji: "✏️", tier: "bronze", xp: 20, hidden: true,
    name: "Revisionist", desc: "Update the same evaluation score 3 or more times",
    rule: { type: "event_count", eventType: "achievement.revisionist_qualified", gte: 1 },
    triggers: ["achievement.revisionist_qualified"],
  },
  {
    id: "the_optimist", emoji: "🌈", tier: "bronze", xp: 35, hidden: true,
    name: "The Optimist", desc: "Set a target grade of 90%+ on 3 or more active courses at once",
    rule: { type: "event_count", eventType: "achievement.optimist_qualified", gte: 1 },
    triggers: ["achievement.optimist_qualified"],
  },

  {
    id: "chronos", emoji: "⏳", tier: "legendary", xp: 2500, hidden: false,
    name: "Chronos", desc: "Maintain a 365-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 365 },
    triggers: ["session.completed"],
  },
  {
    id: "valedictorian", emoji: "🎓", tier: "legendary", xp: 2000, hidden: false,
    name: "Valedictorian", desc: "Master every system: 200+ sessions, 100+ tasks completed, all courses above target",
    rule: { type: "event_count", eventType: "achievement.valedictorian_qualified", gte: 1 },
    triggers: ["achievement.valedictorian_qualified"],
  },
{
    id: "the_quarter", emoji: "📆", tier: "platinum", xp: 750, hidden: false,
    name: "The Quarter", desc: "Reach a 90-day streak",
    rule: { type: "streak", metric: "currentStreak", gte: 90 },
    triggers: ["session.completed"],
  },
  {
    id: "academic_engine", emoji: "⚙️", tier: "gold", xp: 400, hidden: false,
    name: "Academic Engine", desc: "Study at least once a week for 16 consecutive weeks",
    rule: { type: "weekly_sessions", weeks: 16 },
    triggers: ["session.completed"],
  },
  {
    id: "ironclad_planner", emoji: "⛓️", tier: "gold", xp: 350, hidden: false,
    name: "Ironclad Planner", desc: "Link every session to a task or evaluation for 30 consecutive days",
    rule: { type: "linked_sessions_streak", days: 30 },
    triggers: ["session.linked_completed"],
  },
  {
    id: "biological_clock", emoji: "🧬", tier: "silver", xp: 250, hidden: false,
    name: "Biological Clock", desc: "Study in the same 2-hour window for 21 consecutive days",
    rule: { type: "same_window_days", days: 21 },
    triggers: ["session.completed"],
  },
  {
    id: "the_prognosticator", emoji: "👁️", tier: "gold", xp: 300, hidden: true,
    name: "The Prognosticator", desc: "Log a session linked to an evaluation at least 120 hours before it is due",
    rule: { type: "session_before_eval", hoursAhead: 120 },
    triggers: ["session.completed"],
  },
  {
    id: "curator", emoji: "🗄️", tier: "silver", xp: 200, hidden: true,
    name: "Curator", desc: "Archive 5 completed courses",
    rule: { type: "archive_count", gte: 5 },
    triggers: ["course.archived"],
  },
  {
    id: "telemetry_junkie", emoji: "📊", tier: "silver", xp: 150, hidden: true,
    name: "Telemetry Junkie", desc: "Open the Progress page 50 times",
    rule: { type: "event_count", eventType: "page.progress_visited", gte: 50 },
    triggers: ["page.progress_visited"],
  }
  

];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export const TRIGGER_INDEX = (() => {
  const idx = new Map();
  for (const a of ACHIEVEMENTS) {
    for (const t of a.triggers) {
      if (!idx.has(t)) idx.set(t, new Set());
      idx.get(t).add(a.id);
    }
  }
  return idx;
})();