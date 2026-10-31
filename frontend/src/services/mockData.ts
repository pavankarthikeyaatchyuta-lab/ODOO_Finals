import {
  Wedding,
  Enquiry,
  CatererQuote,
  WeddingTask,
  RunSheetItem,
  VendorArrival,
  TimelineDelay,
  Incident,
  ChangeOrder,
  VendorSettlement,
  SeasonMetrics
} from '../types';

export const INITIAL_WEDDINGS: Wedding[] = [
  {
    id: 'wed-001',
    code: 'WED-2026-001',
    coupleNames: 'Rahul Sharma & Ananya Singh',
    partnerGroom: 'Rahul Sharma',
    partnerBride: 'Ananya Singh',
    weddingDate: '2026-12-22',
    endDate: '2026-12-24',
    location: 'Jagmandir Island Palace & Zenana Mahal, Udaipur',
    guestCount: 400,
    budgetMax: 35000000, // ₹3.50 Crores
    packageType: 'full_service',
    status: 'EXECUTION',
    theme: 'Royal Rajputana Heritage & Floating Palace Elegance',
    assignedPlanner: 'Priya Mehra (Principal Luxury Director)',
    agreementSigned: true,
    signedAgreementDate: '2026-08-15',
    signedAgreementPdfUrl: '/agreements/TheRoyalKnot_Agreement_SharmaSingh.pdf',
    depositPaid: true,
    depositAmount: 5000000, // ₹50 Lakhs
    totalClientRevenue: 35000000,
    totalVendorCost: 25000000,
    totalLaborCost: 3000000,
    netProfit: 7000000, // ₹70 Lakhs
    profitMarginPercent: 20.0
  },
  {
    id: 'wed-002',
    code: 'WED-2026-002',
    coupleNames: 'Vikramaditya Rathore & Gayatri Devi',
    partnerGroom: 'Vikramaditya Rathore',
    partnerBride: 'Gayatri Devi',
    weddingDate: '2027-01-10',
    endDate: '2027-01-12',
    location: 'Rambagh Palace, Jaipur',
    guestCount: 650,
    budgetMax: 60000000, // ₹6.00 Crores
    packageType: 'full_service',
    status: 'IN_PLANNING',
    theme: 'Vintage Marwar Royal Durbar',
    assignedPlanner: 'Devendra Kaviraj',
    agreementSigned: true,
    signedAgreementDate: '2026-09-01',
    depositPaid: true,
    depositAmount: 10000000,
    totalClientRevenue: 60000000,
    totalVendorCost: 44000000,
    totalLaborCost: 4500000,
    netProfit: 11500000,
    profitMarginPercent: 19.17
  },
  {
    id: 'wed-003',
    code: 'WED-2026-003',
    coupleNames: 'Kabir Oberoi & Tara Kapoor',
    partnerGroom: 'Kabir Oberoi',
    partnerBride: 'Tara Kapoor',
    weddingDate: '2026-11-20',
    endDate: '2026-11-20',
    location: 'Fairmont, Jaipur',
    guestCount: 450,
    budgetMax: 12000000, // ₹1.20 Crores
    packageType: 'day_of',
    status: 'CONFIRMED',
    theme: 'Contemporary Twilight Palace Chic',
    assignedPlanner: 'Siddharth Jain',
    agreementSigned: true,
    signedAgreementDate: '2026-10-05',
    depositPaid: true,
    depositAmount: 2500000,
    totalClientRevenue: 12000000,
    totalVendorCost: 8500000,
    totalLaborCost: 1200000,
    netProfit: 2300000,
    profitMarginPercent: 19.16
  }
];

export const INITIAL_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-101',
    coupleName: 'Rahul Sharma & Ananya Singh',
    phone: '+91 98290 11223',
    email: 'rahul.ananya@destweddings.in',
    targetDate: '2026-12-22',
    guestCount: 400,
    theme: 'Royal Rajputana Heritage',
    budgetMax: 35000000,
    packageType: 'full_service',
    source: 'INSTAGRAM',
    status: 'CONFIRMED',
    consultationDate: '2026-08-10',
    assignedPlanner: 'Priya Mehra',
    notes: 'Bride specifically requested authentic Mewari cuisine, Lake Pichola sunset pheras, and 400+ VVIP guests from Mumbai and London.',
    agreementSigned: true,
    createdAt: '2026-08-01'
  },
  {
    id: 'enq-102',
    coupleName: 'Aditya Singhania & Meera Merchant',
    phone: '+91 98110 44556',
    email: 'aditya.singhania@group.com',
    targetDate: '2027-02-14',
    guestCount: 500,
    theme: 'Palace Royalty & Floral Glasshouse',
    budgetMax: 45000000,
    packageType: 'full_service',
    source: 'WHATSAPP',
    status: 'CONSULTATION_SCHEDULED',
    consultationDate: '2026-11-05',
    assignedPlanner: 'Priya Mehra',
    notes: 'Father requested digital agreement review before floor plan sharing. Requires strict Jain catering counters.',
    agreementSigned: false, // Gated!
    createdAt: '2026-10-25'
  },
  {
    id: 'enq-103',
    coupleName: 'Arjun Mehta & Sneha Reddy',
    phone: '+91 99800 77889',
    email: 'arjun.mehta@techfounders.io',
    targetDate: '2027-03-05',
    guestCount: 350,
    theme: 'Jaipur Fort Twilight & Sufi Night',
    budgetMax: 20000000,
    packageType: 'day_of',
    source: 'PHONE',
    status: 'NEW',
    assignedPlanner: 'Siddharth Jain',
    notes: 'Day-of coordination package requested. Venue booked independently at Nahargarh Fort.',
    agreementSigned: false,
    createdAt: '2026-10-30'
  }
];

export const INITIAL_CATERER_QUOTES: CatererQuote[] = [
  {
    id: 'quote-caterer-a',
    weddingId: 'wed-001',
    vendorId: 'vendor-c1',
    vendorName: 'SpiceHeaven Royal Caterers (Jaipur & Udaipur)',
    category: 'CATERING',
    pricePerPlate: 1800,
    guestCount: 400,
    foodBaseCost: 720000,
    extraHourRate: 20000,
    additionalCharges: 90000,
    taxAmount: 145800,
    totalAmount: 810000, // Reconciles with Scenario 5
    status: 'SELECTED',
    menuSpecialties: [
      'Mewari Ker Sangri & Gatte ki Sabzi',
      'Awadhi Dum Biryani & Galouti Kebab',
      'Live Charcoal Daal Baati Churma Thali',
      'Traditional Ghevar & Rabri Station'
    ],
    liveCountersCount: 8,
    inclusions: [
      'Uniformed royal butler service (1 per 10 guests)',
      'Brass & silver-plated traditional chafing dishes',
      'Complete mineral water & non-alcoholic beverage bar',
      'Pre-wedding couple tasting session for 6 guests'
    ],
    exclusions: ['Imported single-origin glassware (client rental)'],
    submittedDate: '2026-09-10'
  },
  {
    id: 'quote-caterer-b',
    weddingId: 'wed-001',
    vendorId: 'vendor-c2',
    vendorName: 'Mewar Gourmet Kitchen',
    category: 'CATERING',
    pricePerPlate: 1600,
    guestCount: 400,
    foodBaseCost: 640000,
    extraHourRate: 30000,
    additionalCharges: 70000,
    taxAmount: 127800,
    totalAmount: 740000,
    status: 'REJECTED',
    menuSpecialties: [
      'Marwari Royal Platter',
      'North Indian Frontier Curries',
      'Artisanal Tandoor Breads',
      'Kulfi Falooda Live Trolley'
    ],
    liveCountersCount: 6,
    inclusions: ['Standard buffet stations', 'Basic beverage counter'],
    exclusions: ['Extra service staff after midnight', 'Tasting session chargeable'],
    submittedDate: '2026-09-12'
  },
  {
    id: 'quote-caterer-c',
    weddingId: 'wed-001',
    vendorId: 'vendor-c3',
    vendorName: 'Udaipur Palace Feasts & Banquets',
    category: 'CATERING',
    pricePerPlate: 1500,
    guestCount: 400,
    foodBaseCost: 600000,
    extraHourRate: 10000,
    additionalCharges: 110000,
    taxAmount: 127800,
    totalAmount: 720000,
    status: 'REJECTED',
    menuSpecialties: [
      'Traditional Rajasthani Buffet',
      'Continental Live Pasta Bar',
      'Gulab Jamun Flambé'
    ],
    liveCountersCount: 5,
    inclusions: ['Self-service buffet layout', 'Basic dinner cutlery'],
    exclusions: ['Live counters past 11:00 PM', 'Specialty dietary customization'],
    submittedDate: '2026-09-14'
  }
];

export const INITIAL_TASKS: WeddingTask[] = [
  // Venue & Legal
  { id: 'task-01', weddingId: 'wed-001', title: 'Confirm Jagmandir Palace heritage venue contract & deposit', category: 'VENUE', owner: 'Priya Mehra', dueDate: '2026-09-01', stage: 'DONE', isKeyMilestone: true, packageScope: 'ALL' },
  { id: 'task-02', weddingId: 'wed-001', title: 'Obtain Udaipur local administration permissions & boat transit clearances', category: 'VENUE', owner: 'Siddharth Jain', dueDate: '2026-09-15', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  { id: 'task-03', weddingId: 'wed-001', title: 'Review structural load & electrical generator access for Zenana Mahal', category: 'VENUE', owner: 'Amit Sharma', dueDate: '2026-10-01', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  // Design & Decor
  { id: 'task-04', weddingId: 'wed-001', title: 'Finalize Royal Rajputana 3D moodboard & floral color palette', category: 'DESIGN', owner: 'Priya Mehra', dueDate: '2026-09-20', stage: 'DONE', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY' },
  { id: 'task-05', weddingId: 'wed-001', title: 'Architectural lighting design for floating island mandap', category: 'DESIGN', owner: 'Rohan Verma', dueDate: '2026-10-10', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  { id: 'task-06', weddingId: 'wed-001', title: 'Print custom gold-embossed royal stationery, itineraries & luggage tags', category: 'DESIGN', owner: 'Anita Roy', dueDate: '2026-11-01', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  // Vendors Procurement
  { id: 'task-07', weddingId: 'wed-001', title: 'Execute 3-caterer quotation comparison for 400 guests', category: 'VENDORS', owner: 'Priya Mehra', dueDate: '2026-09-15', stage: 'DONE', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY' },
  { id: 'task-08', weddingId: 'wed-001', title: 'Contract SpiceHeaven Royal Caterers & record ₹3L advance', category: 'VENDORS', owner: 'Devendra Kaviraj', dueDate: '2026-09-18', stage: 'DONE', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY' },
  { id: 'task-09', weddingId: 'wed-001', title: 'Contract celebrity DJ & stage sound engineers', category: 'VENDORS', owner: 'Rohan Verma', dueDate: '2026-09-25', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-10', weddingId: 'wed-001', title: 'Contract royal brass band, nagada drummers & folk dancers', category: 'VENDORS', owner: 'Amit Sharma', dueDate: '2026-10-05', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-11', weddingId: 'wed-001', title: 'Contract cinematic drone photography & 8-camera documentary crew', category: 'VENDORS', owner: 'Priya Mehra', dueDate: '2026-10-12', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  // Mehendi Preparations
  { id: 'task-12', weddingId: 'wed-001', title: 'Curate organic Rajasthani henna paste & hire 15 bridal mehndi artists', category: 'MEHENDI', owner: 'Anita Roy', dueDate: '2026-11-15', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  { id: 'task-13', weddingId: 'wed-001', title: 'Set up lakeside Cabana lounge seating & Marigold canopies', category: 'MEHENDI', owner: 'Amit Sharma', dueDate: '2026-12-21', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-14', weddingId: 'wed-001', title: 'Organize bangle-making live artisan station & welcome turbans', category: 'MEHENDI', owner: 'Anita Roy', dueDate: '2026-12-21', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY' },
  // Sangeet & Sound
  { id: 'task-15', weddingId: 'wed-001', title: 'Stage construction, LED wall rigging & acoustic sound checks', category: 'SANGEET', owner: 'Rohan Verma', dueDate: '2026-12-22', stage: 'DONE', isKeyMilestone: true, packageScope: 'ALL' },
  { id: 'task-16', weddingId: 'wed-001', title: 'Coordinate family dance rehearsals & song track sequencing', category: 'SANGEET', owner: 'Anita Roy', dueDate: '2026-12-22', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-17', weddingId: 'wed-001', title: 'Cold-pyro and atmospheric haze safety compliance inspection', category: 'SANGEET', owner: 'Amit Sharma', dueDate: '2026-12-22', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL' },
  // Wedding Ceremony (Varmala & Pheras)
  { id: 'task-18', weddingId: 'wed-001', title: 'Royal vintage car & vintage boat armada coordination for Baraat', category: 'PHERAS', owner: 'Siddharth Jain', dueDate: '2026-12-23', stage: 'IN_PROGRESS', isKeyMilestone: true, packageScope: 'ALL' },
  { id: 'task-19', weddingId: 'wed-001', title: 'Varmala stage rose-petal drop mechanism calibration', category: 'PHERAS', owner: 'Amit Sharma', dueDate: '2026-12-23', stage: 'IN_PROGRESS', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-20', weddingId: 'wed-001', title: 'Coordinate Vedic priests, havan samagri & royal silver chowkis', category: 'PHERAS', owner: 'Priya Mehra', dueDate: '2026-12-23', stage: 'TO_PLAN', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-21', weddingId: 'wed-001', title: 'Conduct dry run & rehearsal with couple and bridal party', category: 'PHERAS', owner: 'Priya Mehra', dueDate: '2026-12-23', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY' },
  // Reception & Banquet
  { id: 'task-22', weddingId: 'wed-001', title: 'Seating allocations & VIP family head table setup', category: 'RECEPTION', owner: 'Anita Roy', dueDate: '2026-12-24', stage: 'TO_PLAN', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-23', weddingId: 'wed-001', title: 'Coordinate cake cutting champagne toast & live jazz ensemble', category: 'RECEPTION', owner: 'Rohan Verma', dueDate: '2026-12-24', stage: 'TO_PLAN', isKeyMilestone: false, packageScope: 'ALL' },
  { id: 'task-24', weddingId: 'wed-001', title: 'Oversee 8 royal buffet lines & live dessert flambe counters', category: 'RECEPTION', owner: 'Priya Mehra', dueDate: '2026-12-24', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'ALL' },
  // Cleanup & Handover
  { id: 'task-25', weddingId: 'wed-001', title: 'Heritage palace site clearance, floral composting & inventory count', category: 'CLEANUP', owner: 'Amit Sharma', dueDate: '2026-12-25', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'ALL' },
  { id: 'task-26', weddingId: 'wed-001', title: 'Reconcile vendor damages, security deposits & final sign-off with palace curator', category: 'CLEANUP', owner: 'Devendra Kaviraj', dueDate: '2026-12-26', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'ALL' }
];

export const INITIAL_RUN_SHEET: RunSheetItem[] = [
  {
    id: 'run-01',
    weddingId: 'wed-001',
    functionName: 'Baraat Procession',
    activityName: 'Groom Departure by Royal Decorated Boat from City Palace Jetty',
    plannedStartTime: '16:00',
    plannedEndTime: '16:45',
    actualStartTime: '16:05',
    actualEndTime: '16:50',
    status: 'COMPLETED',
    location: 'Lake Pichola / City Palace Jetty',
    responsiblePerson: 'Siddharth Jain',
    linkedVendorIds: ['vendor-boat', 'vendor-drumpack'],
    vendorNames: ['Mewar Boat Fleet', 'Royal Nagada Drummers']
  },
  {
    id: 'run-02',
    weddingId: 'wed-001',
    functionName: 'Baraat Arrival & Toran',
    activityName: 'Baraat Welcome at Jagmandir Ghat with Rose Showers & Dhol',
    plannedStartTime: '16:45',
    plannedEndTime: '17:30',
    actualStartTime: '16:55',
    actualEndTime: '17:40',
    status: 'COMPLETED',
    location: 'Jagmandir Island Jetty',
    responsiblePerson: 'Amit Sharma',
    linkedVendorIds: ['vendor-drumpack', 'vendor-florist'],
    vendorNames: ['Royal Nagada Drummers', 'Jaipur Floral Arts']
  },
  {
    id: 'run-03',
    weddingId: 'wed-001',
    functionName: 'Varmala Ceremony',
    activityName: 'Grand Garland Exchange on Floating Lotus Stage with Cold Pyro',
    plannedStartTime: '19:15',
    plannedEndTime: '20:00',
    actualStartTime: '19:40', // 25 min delay triggered
    status: 'DELAYED',
    location: 'Floating Lotus Stage, Jagmandir Courtyard',
    responsiblePerson: 'Priya Mehra',
    linkedVendorIds: ['vendor-c1', 'vendor-dj', 'vendor-photo', 'vendor-pyro'],
    vendorNames: ['SpiceHeaven Catering', 'DJ Shadow Dubai', 'Stories by Joseph Radhik', 'Starline Pyro']
  },
  {
    id: 'run-04',
    weddingId: 'wed-001',
    functionName: 'Pheras & Wedding Vows',
    activityName: 'Sacred Vedic Pheras & Saptapadi at Glass Mandap',
    plannedStartTime: '20:15',
    plannedEndTime: '21:45',
    status: 'UPCOMING',
    location: 'Heritage Marble Mandap',
    responsiblePerson: 'Priya Mehra',
    linkedVendorIds: ['vendor-priest', 'vendor-photo'],
    vendorNames: ['Vedic Pandit Shastriji', 'Stories by Joseph Radhik']
  },
  {
    id: 'run-05',
    weddingId: 'wed-001',
    functionName: 'Royal Dinner Banquet',
    activityName: 'Grand 400-Guest Royal Mewari Banquet & Live Sitar Ensemble',
    plannedStartTime: '21:30',
    plannedEndTime: '00:30',
    status: 'UPCOMING',
    location: 'Zenana Mahal Royal Courtyard',
    responsiblePerson: 'Anita Roy',
    linkedVendorIds: ['vendor-c1', 'vendor-sitar'],
    vendorNames: ['SpiceHeaven Catering', 'Udaipur Cultural Trust']
  }
];

export const INITIAL_VENDOR_ARRIVALS: VendorArrival[] = [
  {
    id: 'arr-01',
    weddingId: 'wed-001',
    vendorName: 'SpiceHeaven Royal Caterers',
    category: 'Catering & Beverages',
    contactPerson: 'Chef Raghvendra Singh',
    phone: '+91 98290 55443',
    expectedArrivalTime: '13:00',
    actualArrivalTime: '12:45',
    status: 'CHECKED_IN',
    isLate: false,
    notes: 'Kitchen brigade checked in early. All 8 live counters operational.'
  },
  {
    id: 'arr-02',
    weddingId: 'wed-001',
    vendorName: 'Jaipur Floral Arts & Decor',
    category: 'Floral & Mandap Styling',
    contactPerson: 'Harsh Vardhan',
    phone: '+91 94140 12345',
    expectedArrivalTime: '11:00',
    actualArrivalTime: '10:50',
    status: 'CHECKED_IN',
    isLate: false,
    notes: 'Mandap floral canopy 95% complete. Extra backup generator requested.'
  },
  {
    id: 'arr-03',
    weddingId: 'wed-001',
    vendorName: 'DJ Shadow & Sound Rig',
    category: 'DJ & Acoustic Sound',
    contactPerson: 'Sunny K (Manager)',
    phone: '+91 98200 99881',
    expectedArrivalTime: '16:00',
    actualArrivalTime: '16:45',
    status: 'LATE', // FLAGGED IN RED
    isLate: true,
    notes: 'Late arrival: Transport truck held up at Sukhadia Circle traffic. Sound check delayed.'
  },
  {
    id: 'arr-04',
    weddingId: 'wed-001',
    vendorName: 'Stories by Joseph Radhik (Photography)',
    category: 'Cinematography & Stills',
    contactPerson: 'Mohit Rao',
    phone: '+91 98199 00112',
    expectedArrivalTime: '15:30',
    actualArrivalTime: '15:20',
    status: 'CHECKED_IN',
    isLate: false,
    notes: 'Drone pilots registered with palace security. Ready for baraat arrival.'
  }
];

export const INITIAL_DELAYS: TimelineDelay[] = [
  {
    id: 'delay-01',
    weddingId: 'wed-001',
    activityId: 'run-03',
    activityName: 'Varmala Garland Exchange Ceremony',
    originalPlannedTime: '19:15',
    revisedTime: '19:40',
    delayMinutes: 25,
    reason: "Bride procession vehicle held up in traffic + makeup touch-up delay",
    approvedByPlanner: 'Priya Mehra (Lead Director)',
    createdAt: '2026-12-23 18:50',
    affectedVendors: [
      {
        vendorId: 'vendor-photo',
        vendorName: 'Stories by Joseph Radhik',
        category: 'Photography',
        phone: '+91 98199 00112',
        instruction: 'Prepare for revised twilight lighting sequence at 19:40 on Lotus Stage',
        status: 'ACKNOWLEDGED',
        notifiedAt: '18:52',
        acknowledgedAt: '18:55',
        responseNote: 'Confirmed. Repositioned gimbal operator and lighting stands.'
      },
      {
        vendorId: 'vendor-c1',
        vendorName: 'SpiceHeaven Royal Caterers',
        category: 'Catering',
        phone: '+91 98290 55443',
        instruction: 'Extend holding appetizer rounds; delay main banquet opening by 25 mins (to 21:55)',
        status: 'ACKNOWLEDGED',
        notifiedAt: '18:52',
        acknowledgedAt: '18:56',
        responseNote: 'Acknowledged. 4 additional cocktail snack rounds queued.'
      },
      {
        vendorId: 'vendor-family',
        vendorName: 'Family Protocol Coordinator',
        category: 'VIP Coordination',
        phone: '+91 98290 77112',
        instruction: 'Keep Groom family comfortable in Palace Suite; announce revised 19:40 entrance cue',
        status: 'ACKNOWLEDGED',
        notifiedAt: '18:52',
        acknowledgedAt: '18:54',
        responseNote: 'Family briefed. Refreshments served in suite.'
      },
      {
        vendorId: 'vendor-dj',
        vendorName: 'DJ Shadow & Sound Rig',
        category: 'DJ & Sound',
        phone: '+91 98200 99881',
        instruction: 'Extend ambient Rajasthani folk lounge holding audio; hold bridal entry track until 19:40 cue',
        status: 'SENT', // Still WAITING! Proves closed-loop differentiation
        notifiedAt: '18:52',
        responseNote: undefined
      }
    ]
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-01',
    weddingId: 'wed-001',
    title: 'DJ arrived 45m late / Sound check delayed',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: 'Rohan Verma (AV Lead)',
    category: 'VENDOR_DELAY',
    description: 'Main sound console truck delayed in Udaipur traffic. Backup sound console deployed for baraat.',
    reportedAt: '16:15'
  },
  {
    id: 'inc-02',
    weddingId: 'wed-001',
    title: 'Florist requires additional 65kVA silent generator',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    assignedTo: 'Amit Sharma (Operations Lead)',
    category: 'EQUIPMENT',
    description: 'Mandap dynamic chandelier load exceeded generator headroom. Secondary silent generator brought in via boat.',
    reportedAt: '14:30',
    resolvedAt: '15:15',
    resolutionNote: 'Generator operational. Extra rental cost ₹25,000 logged to change orders.'
  },
  {
    id: 'inc-03',
    weddingId: 'wed-001',
    title: 'Bride royal procession car stuck in Old City bazaar traffic',
    severity: 'HIGH',
    status: 'RESOLVED',
    assignedTo: 'Siddharth Jain (Transport Lead)',
    category: 'LOGISTICS',
    description: 'Narrow lane blockade at Hathipole. Police escort coordinated to clear route to jetty.',
    reportedAt: '18:20',
    resolvedAt: '18:45',
    resolutionNote: 'Bride safely reached City Palace jetty. Total schedule slip limited to 25 mins.'
  }
];

export const INITIAL_CHANGE_ORDERS: ChangeOrder[] = [
  {
    id: 'co-001',
    weddingId: 'wed-001',
    code: 'CO-2026-001',
    description: '60 Unexpected VIP Banquet Guests (+60 Royal Dinner Plates)',
    vendorId: 'vendor-c1',
    vendorName: 'SpiceHeaven Royal Caterers',
    category: 'Catering',
    quantity: 60,
    unitPrice: 2500, // ₹2,500 per additional plate
    totalAmount: 150000, // ₹1,50,000
    clientApproved: true,
    authorizedBy: 'Mr. Vikram Singh (Father of the Bride)',
    status: 'APPROVED',
    billingStatus: 'BILLED_TO_CLIENT',
    createdAt: '2026-12-23 21:15'
  },
  {
    id: 'co-002',
    weddingId: 'wed-001',
    code: 'CO-2026-002',
    description: 'Extended DJ Performance (+1 Hour past midnight curfew license)',
    vendorId: 'vendor-dj',
    vendorName: 'DJ Shadow & Sound Rig',
    category: 'Music & Sound',
    quantity: 1,
    unitPrice: 15000,
    totalAmount: 15000, // ₹15,000
    clientApproved: true,
    authorizedBy: 'Rahul Sharma (Groom)',
    status: 'APPROVED',
    billingStatus: 'BILLED_TO_CLIENT',
    createdAt: '2026-12-23 23:45'
  }
];

export const INITIAL_SETTLEMENTS: VendorSettlement[] = [
  {
    id: 'set-001',
    weddingId: 'wed-001',
    vendorId: 'vendor-c1',
    vendorName: 'SpiceHeaven Royal Caterers',
    category: 'Catering & Dining',
    agreedContractAmount: 720000, // Agreed 400 plates @ ₹1,800
    approvedExtras: 90000, // Additional approved catering changes
    totalPayableAmount: 810000, // Matches Scenario 5: ₹8,10,000
    advancesPaid: 300000, // Advance already disbursed: ₹3,00,000
    finalBillAmountSubmitted: 810000,
    balanceDue: 510000, // Expected Net Due: ₹5,10,000
    status: 'RECONCILED',
    hasDiscrepancy: false,
    duplicatePaymentBlocked: false,
    paymentHistory: [
      {
        transactionId: 'TXN-ADV-091',
        amount: 300000,
        type: 'ADVANCE',
        date: '2026-09-18',
        reference: 'HDFC Bank RTGS / Chq #440912'
      }
    ]
  },
  {
    id: 'set-002',
    weddingId: 'wed-001',
    vendorId: 'vendor-dj',
    vendorName: 'DJ Shadow & Sound Rig',
    category: 'Sound & Audio',
    agreedContractAmount: 100000,
    approvedExtras: 15000, // 1 hour extra
    totalPayableAmount: 115000,
    advancesPaid: 50000,
    finalBillAmountSubmitted: 115000,
    balanceDue: 65000,
    status: 'RECONCILED',
    hasDiscrepancy: false,
    duplicatePaymentBlocked: false,
    paymentHistory: [
      {
        transactionId: 'TXN-ADV-095',
        amount: 50000,
        type: 'ADVANCE',
        date: '2026-10-01',
        reference: 'ICICI Bank IMPS / Ref #889102'
      }
    ]
  }
];

export const INITIAL_SEASON_METRICS: SeasonMetrics = {
  seasonYear: 2026,
  totalWeddingsPlanned: 25,
  completedWeddings: 18,
  inProgressWeddings: 7,
  totalSeasonRevenue: 285000000, // ₹28.50 Crores
  totalVendorExpenditure: 198000000, // ₹19.80 Crores
  totalPlannerLaborCost: 28500000, // ₹2.85 Crores
  totalNetProfit: 58500000, // ₹5.85 Crores Net Profit
  averageMarginPercent: 20.52,
  vendorReliabilityAverage: 4.82,
  activeLateVendorsCount: 1,
  openIncidentsCount: 1,
  upcomingReceivables30Days: 45000000, // ₹4.50 Crores
  upcomingVendorDues30Days: 28000000, // ₹2.80 Crores
  weddingWiseProfits: [
    { weddingId: 'wed-001', name: 'Sharma-Singh (Udaipur)', revenue: 35000000, cost: 25000000, labor: 3000000, profit: 7000000, margin: 20.0, status: 'EXECUTION' },
    { weddingId: 'wed-002', name: 'Rathore-Devi (Jaipur)', revenue: 60000000, cost: 44000000, labor: 4500000, profit: 11500000, margin: 19.17, status: 'IN_PLANNING' },
    { weddingId: 'wed-003', name: 'Oberoi-Kapoor (Fairmont)', revenue: 12000000, cost: 8500000, labor: 1200000, profit: 2300000, margin: 19.16, status: 'CONFIRMED' },
    { weddingId: 'wed-004', name: 'Mehta-Reddy (Samode)', revenue: 22000000, cost: 15500000, labor: 2000000, profit: 4500000, margin: 20.45, status: 'CLOSED' },
    { weddingId: 'wed-005', name: 'Verma-Chopra (Taj Lake)', revenue: 42000000, cost: 29000000, labor: 3500000, profit: 9500000, margin: 22.62, status: 'CLOSED' }
  ]
};
