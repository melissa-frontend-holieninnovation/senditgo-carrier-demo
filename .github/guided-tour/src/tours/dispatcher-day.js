// Tour: a dispatcher's day, from the morning overview to checking a delivery.
//
// Tour format
//   minWidth   narrowest window, in px, the tour is written for; below it the tour
//              shows a notice instead of pointing at controls that are not there
//
// Step format
//   route      page the step belongs to, relative to the site base
//   page       that page's name, used when the tour has to send the user back to it
//   advanceOn  'next'  the prompt carries a Next button
//              'click' the user clicks the control of the FIRST prompt to move on
//   skipWhen   a target that this step asks the user to bring on screen (a menu, a panel).
//              While it is on screen the step is over: skipped if it was there already,
//              ended as soon as it appears. If it goes away during the next step,
//              this step comes back.
//   prompts    one to three; the first is the main one and carries the step counter
//     target   data-testid of the control (see src/anchors.js for the other forms)
//     label    the control's own label, used in "Can't find …" messages
//     kind     'hotspot' pulses (a control to click), 'callout' is a steady ring (an explanation)
//     side     preferred side for the prompt: bottom (default), top, right or left
//     text     one or two sentences for an end user; **bold** marks a label on the screen
//     optional true for a secondary prompt that some demo builds lack: the tour leaves it
//              out where it is missing, and the anchor check reports it without failing

export const dispatcherDay = {
  id: 'dispatcher-day',
  title: "A dispatcher's day",
  // Walked down to this width. Narrower than that the demo starts folding the
  // Run Management tabs away, and steps 5, 8 and 10 ask for a click on one.
  minWidth: 1024,
  steps: [
    {
      route: '/',
      page: 'Home',
      advanceOn: 'next',
      prompts: [
        {
          target: 'home-stats',
          label: "Today's numbers",
          kind: 'callout',
          text: "**Today's numbers**: drivers on shift, Run Sheets, stops done and Pending Orders.",
        },
        {
          target: 'home-list-panel',
          label: 'Run Sheets and Orders',
          kind: 'callout',
          side: 'left',
          text: "Today's **Run Sheets** and **Orders**. The ones that need attention are listed first.",
        },
      ],
    },
    {
      route: '/',
      page: 'Home',
      advanceOn: 'click',
      skipWhen: 'nav-child-route-planning',
      prompts: [
        {
          target: 'nav-run-management',
          label: 'Run Management',
          kind: 'hotspot',
          side: 'right',
          text: 'Open **Run Management**. Planning, assigning and tracking all live here.',
        },
      ],
    },
    {
      route: '/',
      page: 'Home',
      advanceOn: 'click',
      prompts: [
        {
          target: 'nav-child-route-planning',
          label: 'Route Planning',
          kind: 'hotspot',
          side: 'right',
          text: 'Start with **Route Planning**: where each region delivers, and when.',
        },
      ],
    },
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
          text: 'Set the delivery area by postcode or suburb, or draw it on the map.',
        },
        {
          target: 'rp-regions',
          label: 'Regions',
          kind: 'callout',
          side: 'right',
          text: 'Each **region** is an area your fleet delivers to. Pick one to see or change it.',
        },
        {
          target: 'rp-times',
          label: 'Delivery times',
          kind: 'callout',
          side: 'left',
          text: 'Delivery times for the region. Orders that come in after the **cut-off** go to the next delivery day.',
        },
      ],
    },
    {
      route: '/run-management/route-planning',
      page: 'Route Planning',
      advanceOn: 'click',
      prompts: [
        {
          target: 'tab-order-management',
          label: 'Order Management',
          kind: 'hotspot',
          text: 'Next, **Order Management**: where Orders get a driver.',
        },
      ],
    },
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
          text: 'Open **Orders & Run Sheets** to see what is waiting.',
        },
        {
          target: 'om-view-toggle',
          label: 'Map / List',
          kind: 'callout',
          text: '**Map** and **List** show the same Orders in two ways.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'next',
      prompts: [
        {
          target: 'pending-section-toggle',
          label: 'Pending Orders',
          kind: 'callout',
          side: 'right',
          text: 'Pending orders are waiting for a run. The order number opens its delivery details.',
        },
        {
          target: { testid: 'pending-order-add-', match: 'prefix' },
          label: 'Assign',
          kind: 'callout',
          side: 'right',
          text: '**Assign** opens a draft for review. Choose a run and stop position, or an eligible shift for a new run.',
        },
        {
          target: 'rail-right-open',
          label: 'Changes',
          kind: 'callout',
          text: '**Changes** lists adjustments saved for later review. A direct map assignment has its own confirmation.',
        },
      ],
    },
    {
      route: '/run-management/order-management',
      page: 'Order Management',
      advanceOn: 'click',
      prompts: [
        {
          target: 'tab-run-sheets',
          label: 'Run Sheets',
          kind: 'hotspot',
          text: 'Open **Run Sheets** to look up a driver and their run, if they have one.',
        },
      ],
    },
    {
      route: '/run-management/run-sheets',
      page: 'Run Sheets',
      advanceOn: 'next',
      prompts: [
        {
          target: 'rs-show',
          label: 'Show',
          kind: 'callout',
          text: 'Filter by a run status such as **Scheduled** or **Completed**. **Free** describes a driver’s availability.',
        },
        {
          target: { testid: 'rs-tr-', match: 'prefix' },
          label: 'a driver row',
          kind: 'callout',
          text: 'A driver row can show an active, upcoming or last closed run. A free driver can have no run sheet.',
        },
      ],
    },
    {
      route: '/run-management/run-sheets',
      page: 'Run Sheets',
      advanceOn: 'click',
      prompts: [
        {
          target: 'tab-order-status',
          label: 'Order Status',
          kind: 'hotspot',
          text: 'Last, **Order Status**: find any Order and see where it is.',
        },
      ],
    },
    {
      route: '/run-management/order-status',
      page: 'Order Status',
      advanceOn: 'next',
      prompts: [
        {
          target: 'os-stage-transit',
          label: 'In Transit',
          kind: 'callout',
          text: 'Click a stage, such as **In Transit**, to list only those Orders. Click it again to show all.',
        },
        {
          target: 'os-search',
          label: 'Search Order or invoice',
          kind: 'callout',
          text: 'Search by order or invoice number. In the sample fleet, S0170044 from run 48213 has a recorded item exception.',
        },
        {
          target: { testid: 'os-status-', match: 'prefix' },
          label: 'Status',
          kind: 'callout',
          side: 'left',
          text: 'This is the individual order’s status. Two orders delivered at the same stop can have different outcomes.',
        },
      ],
    },
  ],
  end: {
    title: "That's a dispatcher's day",
    text: 'You have seen where regions are planned, Orders are assigned, runs are followed and deliveries are checked. Explore freely: this demo changes no real data.',
  },
};
