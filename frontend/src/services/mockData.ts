import {
  Wedding,
  Enquiry,
  Consultation,
  AgreementDetails,
  VendorProfile,
  WeddingFunction,
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

export const INITIAL_FUNCTIONS: WeddingFunction[] = [
  {
    id: 'func-01',
    weddingId: 'wed-001',
    name: 'MEHENDI',
    title: 'Royal Mehendi & Afternoon High Tea',
    date: '2026-12-22',
    startTime: '14:00',
    endTime: '18:00',
    venueArea: 'Lakeside Lawns & Zenana Courtyard, Jagmandir',
    guestCapacity: 400,
    theme: 'Rajasthani Marigold Canopies & Royal Henna',
    assignedLead: 'Anita Roy (Hospitality & Guest Experience)',
    status: 'COMPLETED'
  },
  {
    id: 'func-02',
    weddingId: 'wed-001',
    name: 'SANGEET',
    title: 'Sangeet & Sufi Night Under the Stars',
    date: '2026-12-22',
    startTime: '19:30',
    endTime: '01:00',
    venueArea: 'Zenana Mahal Grand Durbar, City Palace Complex',
    guestCapacity: 450,
    theme: 'Palace Candlelight & Acoustic Sufi Elegance',
    assignedLead: 'Rohan Verma (Production & Sound Lead)',
    status: 'COMPLETED'
  },
  {
    id: 'func-03',
    weddingId: 'wed-001',
    name: 'PHERAS',
    title: 'Varmala & Vedic Pheras Ceremony',
    date: '2026-12-23',
    startTime: '16:30',
    endTime: '21:30',
    venueArea: 'Floating Lotus Island Mandap, Lake Pichola',
    guestCapacity: 400,
    theme: 'Royal Rajputana Heritage & Boat Armada Baraat',
    assignedLead: 'Priya Mehra (Lead Luxury Director)',
    status: 'IN_PROGRESS'
  },
  {
    id: 'func-04',
    weddingId: 'wed-001',
    name: 'RECEPTION',
    title: 'Royal Banquet & Gala Reception',
    date: '2026-12-24',
    startTime: '19:00',
    endTime: '00:30',
    venueArea: 'Manek Chowk Courtyard & Banquet Pavilion',
    guestCapacity: 500,
    theme: 'Midnight Royal Durbar & Champagne Toast',
    assignedLead: 'Devendra Kaviraj (Senior Planner)',
    status: 'UPCOMING'
  }
];

export const INITIAL_TASKS: WeddingTask[] = [
  // Venue & Legal
  { id: 'task-01', weddingId: 'wed-001', title: 'Confirm Jagmandir Palace heritage venue contract & deposit', description: 'Coordinate with palace administration, verify booking deed and security deposit for 3-day full island buyout.', category: 'VENUE', functionName: 'OVERALL', owner: 'Priya Mehra', dueDate: '2026-09-01', stage: 'DONE', isKeyMilestone: true, packageScope: 'ALL', priority: 'HIGH' },
  { id: 'task-02', weddingId: 'wed-001', title: 'Obtain Udaipur administration permissions & boat transit clearances', description: 'Submit municipal clearances for guest boat flotilla transit across Lake Pichola past 10 PM.', category: 'VENUE', functionName: 'OVERALL', owner: 'Siddharth Jain', dueDate: '2026-09-15', stage: 'BLOCKED', blockedReason: 'Awaiting lake patrol night navigation clearance letter from district collector.', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'HIGH' },
  { id: 'task-03', weddingId: 'wed-001', title: 'Review structural load & electrical generator access for Zenana Mahal', description: 'Load testing for stage structures and twin 250 kVA silent diesel generator deployment on island.', category: 'VENUE', functionName: 'OVERALL', owner: 'Amit Sharma', dueDate: '2026-10-01', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'MEDIUM' },
  // Design & Decor
  { id: 'task-04', weddingId: 'wed-001', title: 'Finalize Royal Rajputana 3D moodboard & floral color palette', description: 'Client review session for marigold canopies, imported white orchids, and antique brass candle pillars.', category: 'DESIGN', functionName: 'OVERALL', owner: 'Priya Mehra', dueDate: '2026-09-20', stage: 'DONE', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY', priority: 'HIGH' },
  { id: 'task-05', weddingId: 'wed-001', title: 'Architectural lighting design for floating island mandap', description: 'Waterproof underwater illumination, facade wash lighting on heritage stone pavilions.', category: 'DESIGN', functionName: 'PHERAS', owner: 'Rohan Verma', dueDate: '2026-10-10', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'MEDIUM' },
  { id: 'task-06', weddingId: 'wed-001', title: 'Print custom gold-embossed royal stationery, itineraries & luggage tags', description: 'Handcrafted parchment invitations, wax seals, welcome hamper booklets and guest key cards.', category: 'DESIGN', functionName: 'OVERALL', owner: 'Anita Roy', dueDate: '2026-11-01', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'NORMAL' },
  // Vendors Procurement
  { id: 'task-07', weddingId: 'wed-001', title: 'Execute 3-caterer quotation comparison for 400 guests', description: 'Benchmark SpiceHeaven, Mewar Gourmet, and Palace Feasts across per-plate rates, live stalls, and extra hours.', category: 'VENDORS', functionName: 'OVERALL', owner: 'Priya Mehra', dueDate: '2026-09-15', stage: 'DONE', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY', priority: 'HIGH' },
  { id: 'task-08', weddingId: 'wed-001', title: 'Contract SpiceHeaven Royal Caterers & record advance', description: 'Sign catering SLA, lock agreed per-plate rate of ₹1,800, and disburse initial catering advance.', category: 'VENDORS', functionName: 'OVERALL', owner: 'Devendra Kaviraj', dueDate: '2026-09-18', stage: 'DONE', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY', priority: 'HIGH' },
  { id: 'task-09', weddingId: 'wed-001', title: 'Contract celebrity DJ & stage sound engineers', description: 'Acoustic sound rider agreement with DJ Shadow rig for Sangeet night and after-party.', category: 'VENDORS', functionName: 'SANGEET', owner: 'Rohan Verma', dueDate: '2026-09-25', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL', priority: 'MEDIUM' },
  { id: 'task-10', weddingId: 'wed-001', title: 'Contract royal brass band, nagada drummers & folk dancers', description: 'Secure Ustad Banne Khan 12-member nagada ensemble and Chari folk dancers for baraat procession.', category: 'VENDORS', functionName: 'PHERAS', owner: 'Amit Sharma', dueDate: '2026-10-05', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL', priority: 'MEDIUM' },
  { id: 'task-11', weddingId: 'wed-001', title: 'Contract cinematic drone photography & 8-camera documentary crew', description: 'Full coverage agreement with Stories by Joseph Radhik for all 3 days including same-day edit trailer.', category: 'VENDORS', functionName: 'OVERALL', owner: 'Priya Mehra', dueDate: '2026-10-12', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'MEDIUM' },
  // Mehendi Preparations
  { id: 'task-12', weddingId: 'wed-001', title: 'Curate organic Rajasthani henna paste & hire 15 bridal mehndi artists', description: 'Sojat organic henna batches and luxury bridal mehndi specialist booking with armrest setups.', category: 'MEHENDI', functionName: 'MEHENDI', owner: 'Anita Roy', dueDate: '2026-11-15', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'NORMAL' },
  { id: 'task-13', weddingId: 'wed-001', title: 'Set up lakeside Cabana lounge seating & Marigold canopies', description: 'Daytime sunshade canopies, silk cushions, and vintage swing setup overlooking the lake.', category: 'MEHENDI', functionName: 'MEHENDI', owner: 'Amit Sharma', dueDate: '2026-12-21', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL', priority: 'MEDIUM' },
  { id: 'task-14', weddingId: 'wed-001', title: 'Organize bangle-making live artisan station & welcome turbans', description: 'Live lac bangle craftsman from Jaipur old bazaar and safa tying team at arrival jetty.', category: 'MEHENDI', functionName: 'MEHENDI', owner: 'Anita Roy', dueDate: '2026-12-21', stage: 'DONE', isKeyMilestone: false, packageScope: 'FULL_SERVICE_ONLY', priority: 'NORMAL' },
  // Sangeet & Sound
  { id: 'task-15', weddingId: 'wed-001', title: 'Stage construction, LED wall rigging & acoustic sound checks', description: 'Main performance stage with high-density LED backdrop, wireless mics, and sub-woofer calibration.', category: 'SANGEET', functionName: 'SANGEET', owner: 'Rohan Verma', dueDate: '2026-12-22', stage: 'DONE', isKeyMilestone: true, packageScope: 'ALL', priority: 'HIGH' },
  { id: 'task-16', weddingId: 'wed-001', title: 'Coordinate family dance rehearsals & song track sequencing', description: 'Green room cue manager and rehearsal sequence check with couple and cousins.', category: 'SANGEET', functionName: 'SANGEET', owner: 'Anita Roy', dueDate: '2026-12-22', stage: 'DONE', isKeyMilestone: false, packageScope: 'ALL', priority: 'NORMAL' },
  { id: 'task-17', weddingId: 'wed-001', title: 'Cold-pyro and atmospheric haze safety compliance inspection', description: 'Fire marshal walk-through and verification of non-hazardous sparkular machines.', category: 'SANGEET', functionName: 'SANGEET', owner: 'Amit Sharma', dueDate: '2026-12-22', stage: 'BLOCKED', blockedReason: 'Awaiting local fire department inspector on-site safety certification signature.', isKeyMilestone: false, packageScope: 'ALL', priority: 'HIGH' },
  // Wedding Ceremony (Varmala & Pheras)
  { id: 'task-18', weddingId: 'wed-001', title: 'Royal vintage car & vintage boat armada coordination for Baraat', description: 'Coordinate 4 royal royal motorboats for groom side arrival from City Palace jetty to Jagmandir.', category: 'PHERAS', functionName: 'PHERAS', owner: 'Siddharth Jain', dueDate: '2026-12-23', stage: 'IN_PROGRESS', isKeyMilestone: true, packageScope: 'ALL', priority: 'HIGH' },
  { id: 'task-19', weddingId: 'wed-001', title: 'Varmala stage rose-petal drop mechanism calibration', description: 'Overhead floral drop rig check with remote trigger mechanism on the floating lotus platform.', category: 'PHERAS', functionName: 'PHERAS', owner: 'Amit Sharma', dueDate: '2026-12-23', stage: 'IN_PROGRESS', isKeyMilestone: false, packageScope: 'ALL', priority: 'HIGH' },
  { id: 'task-20', weddingId: 'wed-001', title: 'Coordinate Vedic priests, havan samagri & royal silver chowkis', description: 'Head priest from Nathdwara, pure sandalwood, holy water from 7 rivers and ceremonial seating.', category: 'PHERAS', functionName: 'PHERAS', owner: 'Priya Mehra', dueDate: '2026-12-23', stage: 'TO_PLAN', isKeyMilestone: false, packageScope: 'ALL', priority: 'HIGH' },
  { id: 'task-21', weddingId: 'wed-001', title: 'Conduct dry run & rehearsal with couple and bridal party', description: 'Complete step-by-step cueing rehearsal from Toran strike to varmala and phera rounds.', category: 'PHERAS', functionName: 'PHERAS', owner: 'Priya Mehra', dueDate: '2026-12-23', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'FULL_SERVICE_ONLY', priority: 'HIGH' },
  // Reception & Banquet
  { id: 'task-22', weddingId: 'wed-001', title: 'Seating allocations & VIP family head table setup', description: 'Custom printed gold namecards, royal velvet chairs, and personal butler assignments for immediate family.', category: 'RECEPTION', functionName: 'RECEPTION', owner: 'Anita Roy', dueDate: '2026-12-24', stage: 'TO_PLAN', isKeyMilestone: false, packageScope: 'ALL', priority: 'MEDIUM' },
  { id: 'task-23', weddingId: 'wed-001', title: 'Coordinate cake cutting champagne toast & live jazz ensemble', description: '5-tier architectural palace cake delivery, crystal coupe glasses, and acoustic jazz accompaniment.', category: 'RECEPTION', functionName: 'RECEPTION', owner: 'Rohan Verma', dueDate: '2026-12-24', stage: 'TO_PLAN', isKeyMilestone: false, packageScope: 'ALL', priority: 'NORMAL' },
  { id: 'task-24', weddingId: 'wed-001', title: 'Oversee 8 royal buffet lines & live dessert flambe counters', description: 'Chef Raghvendra Singh briefing, chafing dish temperature monitoring, and butler refilling lines.', category: 'RECEPTION', functionName: 'RECEPTION', owner: 'Priya Mehra', dueDate: '2026-12-24', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'ALL', priority: 'HIGH' },
  // Cleanup & Handover
  { id: 'task-25', weddingId: 'wed-001', title: 'Heritage palace site clearance, floral composting & inventory count', description: 'Palace heritage grounds inspection, disassembly of trussing, and eco-friendly floral collection.', category: 'CLEANUP', functionName: 'OVERALL', owner: 'Amit Sharma', dueDate: '2026-12-25', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'ALL', priority: 'MEDIUM' },
  { id: 'task-26', weddingId: 'wed-001', title: 'Reconcile vendor damages, security deposits & palace curator sign-off', description: 'Final walk-through with palace estate manager, damage inspection and deposit release sign-off.', category: 'CLEANUP', functionName: 'OVERALL', owner: 'Devendra Kaviraj', dueDate: '2026-12-26', stage: 'TO_PLAN', isKeyMilestone: true, packageScope: 'ALL', priority: 'HIGH' }
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

export const INITIAL_CONSULTATIONS: Consultation[] = [
  {
    id: 'con-001',
    weddingId: 'wed-001',
    enquiryId: 'enq-101',
    coupleName: 'Rahul Sharma & Ananya Singh',
    state: 'COMPLETED',
    preferredAt: '2026-08-10T14:30:00+05:30',
    message: 'Review destination feasibility for Jagmandir Palace, Udaipur and review preliminary regional catering options.',
    startAt: '2026-08-10T14:30:00+05:30',
    endAt: '2026-08-10T15:30:00+05:30',
    plannerId: 'usr-002',
    plannerName: 'Priya Mehra (Lead Luxury Director)',
    internalNotes: 'Client aligned on Full-Service package. Service agreement generated and e-signed.',
    createdAt: '2026-08-05T10:00:00+05:30'
  },
  {
    id: 'con-002',
    weddingId: 'wed-002',
    enquiryId: 'enq-102',
    coupleName: 'Aditya Singhania & Meera Merchant',
    state: 'CONFIRMED',
    preferredAt: '2026-11-05T16:00:00+05:30',
    message: 'First consultation to review Rambagh Palace dates and Jain catering standards for 500 guests.',
    startAt: '2026-11-05T16:00:00+05:30',
    endAt: '2026-11-05T17:00:00+05:30',
    plannerId: 'usr-002',
    plannerName: 'Priya Mehra',
    internalNotes: 'Must complete digital agreement signing before sharing floral and layout designs.',
    createdAt: '2026-10-25T11:30:00+05:30'
  },
  {
    id: 'con-003',
    weddingId: 'wed-003',
    enquiryId: 'enq-103',
    coupleName: 'Arjun Mehta & Sneha Reddy',
    state: 'REQUESTED',
    preferredAt: '2026-11-12T11:00:00+05:30',
    message: 'Couple requested initial video consultation regarding Day-of coordination at Nahargarh Fort.',
    plannerName: 'Siddharth Jain (Pending Confirmation)',
    createdAt: '2026-10-30T15:00:00+05:30'
  }
];

export const INITIAL_AGREEMENTS: AgreementDetails[] = [
  {
    id: 'agr-001',
    enquiryId: 'enq-101',
    weddingId: 'wed-001',
    coupleNames: 'Rahul Sharma & Ananya Singh',
    signedDate: '2026-08-15',
    status: 'VERIFIED',
    packageType: 'full_service',
    totalFee: 3500000, // ₹35 Lakhs planning fee
    milestone1Deposit: 1000000,
    milestone2Advance: 1500000,
    milestone3Final: 1000000,
    pdfUrl: '/agreements/TheRoyalKnot_Agreement_SharmaSingh.pdf',
    signedDocumentName: 'TRK-2026-SharmaSingh-Executed.pdf',
    signedDocumentSize: '2.4 MB',
    clientSignerName: 'Rahul Sharma & Ananya Singh',
    clientSignerIp: '103.211.54.12 (Aadhaar / Mobile OTP Verified)'
  },
  {
    id: 'agr-002',
    enquiryId: 'enq-102',
    weddingId: 'wed-002',
    coupleNames: 'Aditya Singhania & Meera Merchant',
    status: 'SENT_FOR_SIGNATURE',
    packageType: 'full_service',
    totalFee: 4500000,
    milestone1Deposit: 1500000,
    milestone2Advance: 2000000,
    milestone3Final: 1000000
  }
];

export const INITIAL_VENDOR_PROFILES: VendorProfile[] = [
  {
    id: 'v-01',
    name: 'SpiceHeaven Royal Caterers',
    category: 'Catering & Beverages',
    location: 'Jaipur & Udaipur Hubs',
    rating: 4.9,
    punctuality: '98%',
    status: 'CONTRACTED',
    contactPerson: 'Chef Raghvendra Singh',
    phone: '+91 98290 55443',
    email: 'raghvendra@spiceheavenroyal.com',
    specialties: ['Royal Mewari Thali', 'Ker Sangri', 'Live Charcoal Daal Baati', 'Ghevar Live Counter'],
    priceRange: '₹1,600 – ₹2,500 / Plate',
    incidentCount: 0,
    pastWeddings: [
      { weddingCode: 'WED-2025-014', coupleNames: 'Kapoor-Singhania', seasonYear: 2025, performanceReview: 'Flawless Rajasthani live stations and butler service.', rating: 5.0 },
      { weddingCode: 'WED-2025-021', coupleNames: 'Mehta-Bansal', seasonYear: 2025, performanceReview: 'Handled 50 unexpected guests smoothly with zero buffet delay.', rating: 4.8 }
    ]
  },
  {
    id: 'v-02',
    name: 'Mewar Gourmet Kitchen',
    category: 'Catering & Beverages',
    location: 'Udaipur',
    rating: 4.6,
    punctuality: '92%',
    status: 'STANDBY',
    contactPerson: 'Kailash Meena',
    phone: '+91 98291 22334',
    email: 'kailash@mewargourmet.com',
    specialties: ['Marwari Royal Platter', 'Continental Live Bar', 'Kulfi Falooda'],
    priceRange: '₹1,500 – ₹2,000 / Plate',
    incidentCount: 1,
    pastWeddings: [
      { weddingCode: 'WED-2025-008', coupleNames: 'Shah-Desai', seasonYear: 2025, performanceReview: 'Good food quality, slight delay in midnight dessert refilling.', rating: 4.5 }
    ]
  },
  {
    id: 'v-03',
    name: 'Jaipur Floral Arts & Decor',
    category: 'Floral & Mandap Styling',
    location: 'Jaipur',
    rating: 4.8,
    punctuality: '95%',
    status: 'CONTRACTED',
    contactPerson: 'Harsh Vardhan',
    phone: '+91 94140 12345',
    email: 'harsh@jaipurfloralarts.com',
    specialties: ['Heritage Mandap Canopies', 'Marigold Tunnels', 'Imported Orchid Chandeliers'],
    priceRange: '₹25,00,000 – ₹80,00,000 / Event',
    incidentCount: 1,
    pastWeddings: [
      { weddingCode: 'WED-2025-019', coupleNames: 'Rathore-Singh', seasonYear: 2025, performanceReview: 'Spectacular floral aesthetics; needed generator backup.', rating: 4.8 }
    ]
  },
  {
    id: 'v-04',
    name: 'DJ Shadow & Sound Rig',
    category: 'DJ & Sound Acoustics',
    location: 'Mumbai & Udaipur',
    rating: 4.5,
    punctuality: '88%',
    status: 'ACTIVE_LATE',
    contactPerson: 'Sunny K (Road Manager)',
    phone: '+91 98200 99881',
    email: 'bookings@djshadowdubai.com',
    specialties: ['Bollywood Celebrity Sets', 'Line Array Concert Audio', 'Cold Pyro Integration'],
    priceRange: '₹1,00,000 – ₹3,50,000 / Night',
    incidentCount: 2,
    pastWeddings: [
      { weddingCode: 'WED-2025-022', coupleNames: 'Oberoi-Chadha', seasonYear: 2025, performanceReview: 'Unmatched energy; sound check delayed by 30 mins.', rating: 4.4 }
    ]
  },
  {
    id: 'v-05',
    name: 'Stories by Joseph Radhik',
    category: 'Photography & Cinematography',
    location: 'Pan-India / International',
    rating: 5.0,
    punctuality: '100%',
    status: 'CONTRACTED',
    contactPerson: 'Mohit Rao',
    phone: '+91 98199 00112',
    email: 'studios@storiesbyjosephradhik.com',
    specialties: ['Cinematic Royal Portraits', 'Drone Fleet Coverage', 'Same-Day Highlights Reel'],
    priceRange: '₹15,00,000 – ₹40,00,000 / Wedding',
    incidentCount: 0,
    pastWeddings: [
      { weddingCode: 'WED-2025-001', coupleNames: 'Dugar-Lodha', seasonYear: 2025, performanceReview: 'World-class imagery, impeccably punctual crew.', rating: 5.0 }
    ]
  },
  {
    id: 'v-06',
    name: 'Royal Nagada Drummers & Shehnai',
    category: 'Traditional Folk & Baraat',
    location: 'Udaipur Old City',
    rating: 4.9,
    punctuality: '96%',
    status: 'CONTRACTED',
    contactPerson: 'Ustad Banne Khan',
    phone: '+91 94141 88990',
    email: 'info@udaipurfolkarts.org',
    specialties: ['Baraat Nagada Beats', 'Shehnai Welcome', 'Ghoomar Dancers Ensemble'],
    priceRange: '₹50,000 – ₹2,00,000 / Procession',
    incidentCount: 0,
    pastWeddings: [
      { weddingCode: 'WED-2025-004', coupleNames: 'Chauhan-Solanki', seasonYear: 2025, performanceReview: 'Authentic royal welcome for boat procession.', rating: 4.9 }
    ]
  }
];
