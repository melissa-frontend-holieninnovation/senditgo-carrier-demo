// Tour: the Roster, from the week board to booking leave.
//
// The format is described at the top of dispatcher-day.js. This tour starts on the
// Roster page and only explains: it never saves a Shift, working days or leave.
// Controls that come and go (the search field folds into an icon while a driver is
// open in a narrow window; leave buttons need the right role) are secondary notes,
// so the tour never waits for them.

export const roster = {
  id: 'roster',
  title: 'Who works when: the Roster',
  minWidth: 1024,
  steps: [
    {
      route: '/roster',
      page: 'Roster',
      advanceOn: 'next',
      prompts: [
        {
          target: 'roster-week-board',
          label: 'the week',
          kind: 'callout',
          side: 'top',
          text: 'Each column is one day: who is **available**, **on duty**, **free** or **on leave**.',
        },
        {
          target: 'roster-week-nav',
          label: 'Week',
          kind: 'callout',
          text: 'Go to another week, or click the dates to pick one.',
        },
      ],
    },
    {
      route: '/roster',
      page: 'Roster',
      advanceOn: 'next',
      // The tick boxes in front of each name only show on hover, so the tour does not point at them.
      prompts: [
        {
          target: 'roster-weekends',
          label: 'Weekends',
          kind: 'callout',
          text: 'Show or hide **Saturday** and **Sunday**.',
        },
        {
          target: 'roster-search',
          label: 'Search drivers',
          kind: 'callout',
          text: 'Find a driver by name.',
        },
      ],
    },
    {
      route: '/roster',
      page: 'Roster',
      advanceOn: 'click',
      skipWhen: 'roster-panel',
      prompts: [
        {
          // The name button only: the tick box beside it selects the driver instead.
          target: 'css:[data-testid^="roster-chip-"] button',
          label: "a driver's name",
          kind: 'hotspot',
          side: 'right',
          text: "Click a driver's name to see their week.",
        },
      ],
    },
    {
      // Straight after the step that opens the panel, so closing the panel brings that step back.
      route: '/roster',
      page: 'Roster',
      advanceOn: 'next',
      prompts: [
        {
          target: 'roster-panel-week',
          label: 'This week',
          kind: 'callout',
          side: 'left',
          text: 'The days this driver works this week.',
        },
        {
          target: 'roster-panel-shifts',
          label: 'Shifts',
          kind: 'callout',
          side: 'left',
          text: 'Their **Shifts**: where and when they deliver. **Assign Shifts** changes them.',
        },
      ],
    },
    {
      route: '/roster',
      page: 'Roster',
      advanceOn: 'click',
      prompts: [
        {
          target: 'roster-driver-leave',
          label: 'Driver Leave',
          kind: 'hotspot',
          text: '**Driver Leave** shows bookings for the selected fleet and month.',
        },
        // Placed with the step that leaves the page rather than with the panel notes: in a short
        // window the panel's foot is too close to its Shifts for two prompts.
        {
          target: 'roster-panel-create-leave',
          label: 'Create Leave',
          kind: 'callout',
          side: 'top',
          text: '**Create Leave** opens a leave request for this driver. **Change Working Days** manages their usual schedule.',
        },
      ],
    },
    {
      route: '/roster/driver-leave',
      page: 'Driver Leave',
      advanceOn: 'next',
      prompts: [
        {
          target: 'dl-status',
          label: 'Status',
          kind: 'callout',
          text: 'Filter leave bookings in this fleet and month by their status.',
        },
        {
          target: 'dl-create',
          label: 'Create Leave',
          kind: 'callout',
          side: 'left',
          text: '**Create Leave** opens a form for a driver’s days off. The booking appears after it’s saved.',
        },
        {
          target: { testid: 'dl-driver-', match: 'prefix' },
          label: 'a booking',
          kind: 'callout',
          text: 'One row per booking: driver, dates, reason and status.',
        },
      ],
    },
  ],
  end: {
    title: "That's the Roster",
    text: "You have seen who works each day, a driver's week and Shifts, and where leave is booked. Explore freely: this demo changes no real data.",
  },
};
