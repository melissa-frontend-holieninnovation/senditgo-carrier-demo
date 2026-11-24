// Tour: Route Planning, where and when a region delivers.
//
// The format is described at the top of dispatcher-day.js. This tour starts on the
// Route Planning page and only explains: it never saves or submits a region. Below
// 1280px the demo hides the region list, so the list is only ever a secondary note.

export const routePlanning = {
  id: 'route-planning',
  title: 'Route Planning: where and when you deliver',
  minWidth: 1024,
  steps: [
    {
      route: '/run-management/route-planning',
      page: 'Route Planning',
      advanceOn: 'next',
      prompts: [
        {
          target: 'rp-area-box',
          label: 'Delivery area',
          kind: 'callout',
          side: 'left',
          text: 'Type a postcode or suburb, or use **Circle** or **Draw a shape** on the map, to set where this region delivers.',
        },
        {
          target: 'rp-regions',
          label: 'Regions',
          kind: 'callout',
          side: 'right',
          text: 'Each **region** is an area your fleet delivers to. Pick one to see or change it.',
        },
        {
          target: 'planning-legend',
          label: 'Map key',
          kind: 'callout',
          side: 'top',
          text: 'On the map: this region, the areas left out and the other regions.',
        },
      ],
    },
    {
      route: '/run-management/route-planning',
      page: 'Route Planning',
      advanceOn: 'next',
      prompts: [
        {
          target: 'rp-days',
          label: 'Delivery days',
          kind: 'callout',
          side: 'left',
          text: 'The days a new Shift delivers.',
        },
        {
          target: 'rp-times',
          label: 'Delivery times',
          kind: 'callout',
          side: 'left',
          text: 'Read the **cut-off** and delivery window for this shift. An order arriving later needs another eligible shift.',
        },
      ],
    },
    {
      route: '/run-management/route-planning',
      page: 'Route Planning',
      advanceOn: 'next',
      prompts: [
        {
          target: 'rp-shifts',
          label: 'Shifts',
          kind: 'callout',
          side: 'left',
          text: 'Drivers on these **Shifts** deliver in this region.',
        },
        {
          target: 'create-shift-save',
          label: 'Create Shift',
          kind: 'callout',
          side: 'left',
          text: '**Create Shift** adds these days and times as a new Shift.',
        },
        {
          target: 'rp-shift-add',
          label: 'Select Existing Shift',
          kind: 'callout',
          side: 'left',
          text: '**Select Existing Shift** adds a Shift you already have.',
        },
      ],
    },
    {
      route: '/run-management/route-planning',
      page: 'Route Planning',
      advanceOn: 'next',
      prompts: [
        {
          // The whole footer: its second button is Submit for review or Activate, depending on
          // the region the visitor has picked.
          target: 'rp-footer',
          label: 'Save draft',
          kind: 'callout',
          side: 'top',
          text: 'Read the region’s status here. **Save draft** keeps edits, while submitting for review or activating is a separate action.',
        },
        {
          target: 'rp-undo',
          label: 'Undo',
          kind: 'callout',
          side: 'bottom',
          text: '**Undo** and **Redo** step through your last changes.',
        },
      ],
    },
  ],
  end: {
    title: "That's Route Planning",
    text: 'You have seen how a region gets its area, delivery days and times, and Shifts, and where its changes are saved or sent on. Explore freely: this demo changes no real data.',
  },
};
