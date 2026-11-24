// Tour: Order Management, from the Orders waiting for a driver to a Run Sheet's stops.
//
// The format is described at the top of dispatcher-day.js. This tour starts on the
// Order Management page and only explains: it never assigns an Order or applies a
// change. It points at panels and cards, not at labels the map draws, so it also
// works where the map cannot load. Each main prompt is a control that stays on screen
// whatever the visitor does on that step (a section heading, not the list under it),
// and a control that only exists in one view or build is a secondary note.

// Both targets are visible markers of a legitimate queue state.
const unavailableInspection = {
  when: 'css:[data-testid="pending-empty"], [data-testid="pending-section-toggle"][aria-expanded="false"]',
  message:
    'No pending order is visible in this list. Continue to the map tools.',
  action: 'continue',
  nextStep: 'map-tools',
};

const inspectedSummary =
  'css:[data-testid="om-left-rail"] [data-testid^="om-order-summary-"]';

export const orderManagement = {
  id: 'order-management',
  title: 'Order Management: inspect and plan deliveries',
  minWidth: 1024,
  steps: [
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'click',
      skipWhen: 'om-left-rail',
      prompts: [
        {
          target: 'rail-left-open',
          label: 'Orders & Run Sheets',
          kind: 'hotspot',
          text: "Open **Orders & Run Sheets**: the Orders still waiting for a driver, and today's Run Sheets.",
        },
        {
          target: 'om-search',
          label: 'Search',
          kind: 'callout',
          text: 'Search for an Order, a driver or a Run Sheet.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'next',
      // Both sections of the rail in one step, straight after the step that opens the rail:
      // closing the rail now brings that step back.
      prompts: [
        {
          target: 'pending-section-toggle',
          label: 'Pending Orders',
          kind: 'callout',
          side: 'right',
          text: 'These orders are waiting for a run. The countdown, when shown, belongs to the next shift cut-off in this fleet.',
        },
        {
          target: { testid: 'pending-order-add-', match: 'prefix' },
          label: 'Assign',
          kind: 'callout',
          side: 'right',
          text: '**Assign** opens a draft. Choose a run and a stop position, then review before confirming.',
        },
        {
          target: 'runsheet-section-toggle',
          label: 'Run Sheets',
          kind: 'callout',
          side: 'right',
          text: '**Run Sheets** shows existing runs and available drivers. A new run for a free driver needs an eligible shift.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'click',
      skipWhen: inspectedSummary,
      unavailable: unavailableInspection,
      prompts: [
        {
          target: { testid: 'pending-select-', match: 'prefix' },
          label: 'the order number',
          kind: 'hotspot',
          side: 'right',
          text: 'Open this order number to inspect its delivery and items. The checkbox beside it picks the order for an action.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'next',
      unavailable: unavailableInspection,
      prompts: [
        {
          target: inspectedSummary,
          label: 'Order details',
          kind: 'callout',
          side: 'right',
          text: 'Read the requested delivery, SKUs and remaining quantities here. Item exceptions appear beside the affected SKU when recorded.',
        },
      ],
    },
    {
      id: 'map-tools',
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'next',
      prompts: [
        {
          // The switch is there in both views; the two map notes only show in Map view.
          target: 'om-view-toggle',
          label: 'Map / List',
          kind: 'callout',
          text: 'On **Map**, open a stop and then an order number to inspect it. **List** shows the run sheets and their stops.',
        },
        {
          target: 'om-map-select-toggle',
          label: 'Select Orders',
          kind: 'callout',
          text: '**Select Orders** picks scheduled orders from numbered stops. Pending orders have their own checkboxes in the left panel.',
        },
        {
          target: 'om-next-stop-legend',
          label: 'Next stops under 10 min are locked',
          kind: 'callout',
          side: 'top',
          text: 'On a run in progress, the next unreached stop is protected when its ETA is under ten minutes away.',
          // Not in the demo build of 19 Nov; the tour leaves the note out there.
          optional: true,
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'click',
      skipWhen: 'changes-rail',
      prompts: [
        {
          target: 'rail-right-open',
          label: 'Changes',
          kind: 'hotspot',
          text: 'Open **Changes** to review adjustments saved for later. This panel can be empty.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'next',
      practice: 'stale-selection',
      prompts: [
        {
          target: 'changes-rail',
          label: 'Changes',
          kind: 'callout',
          side: 'left',
          text: 'Saved changes wait here. Try the practice selection to see what happens when another dispatcher takes one of two example orders.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'click',
      skipWhen: 'om-runsheet-overview',
      prompts: [
        {
          target:
            'css:[data-testid="om-view-toggle"] button[data-value="list"]',
          label: 'List',
          kind: 'hotspot',
          text: "Switch to **List** to see today's Run Sheets as cards.",
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'click',
      skipWhen: 'om-detail-title',
      unavailable: {
        when: 'css:[data-testid="om-runsheet-overview"] [data-brand-part="empty-state"]',
        message:
          'There are no run sheets to inspect in this view. You can finish the tour here.',
        action: 'finish',
      },
      prompts: [
        {
          // Any Run Sheet will do: which ones exist depends on the fleet and the scenario.
          target: { testid: 'om-overview-', match: 'prefix' },
          label: 'a Run Sheet',
          kind: 'hotspot',
          text: 'Open a run sheet to inspect its stops and orders. Available actions depend on your role and the current stop and run status.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'next',
      unavailable: {
        when: 'om-detail-idle',
        message:
          'This driver has no run sheet to inspect. You can finish the tour here.',
        action: 'finish',
      },
      prompts: [
        {
          target:
            'css:[data-testid="om-detail-panel"]:not(:has([data-testid="om-detail-idle"])) [data-testid="om-detail-figures"]',
          label: 'Run Sheet summary',
          kind: 'callout',
          text: 'Read the shift and route totals here. Open an order number below to inspect that delivery.',
        },
        {
          target: { testid: 'stop-time-', match: 'prefix' },
          label: 'Stop time',
          kind: 'callout',
          text: 'Plan is the scheduled time, ETA is the estimate and Arrived is shown once an arrival is recorded.',
        },
        {
          target: 'om-select-all',
          label: 'Pick every Order on this Run Sheet',
          kind: 'callout',
          text: 'Selection skips warehouse stops and orders at the protected next stop. Each action has its own eligibility checks.',
        },
      ],
    },
  ],
  end: {
    title: "That's Order Management",
    text: 'You can return to pending orders, review a draft assignment or inspect a run sheet in the demo.',
  },
};
