/**
 * =============================================================================
 * File: task-templates.ts
 * Module: Wedding Milestone & Task Templates Catalog
 * =============================================================================
 * Standard operating procedure (SOP) milestone templates and task schedules automatically provisioned for new royal weddings.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import type { PackageType, WeddingFunctionType } from '@prisma/client';

export interface TaskTemplate { key: string; title: string; description: string; category: string; days: number; functionType?: WeddingFunctionType }
const task = (key: string, title: string, category: string, days: number, description: string, functionType?: WeddingFunctionType): TaskTemplate => ({ key, title, category, days, description, ...(functionType ? { functionType } : {}) });
const execution: TaskTemplate[] = [
  task('venue-access', 'Review venue access and operating windows', 'VENUE', -7, 'Review the booked venue access rules and record load-in and exit windows.'),
  task('vendor-directory', 'Verify vendor contacts and escalation numbers', 'VENDOR_COORDINATION', -7, 'Check the contact sheet against the contracted vendor list.'),
  task('vendor-handover', 'Collect final vendor scope handovers', 'VENDOR_COORDINATION', -5, 'Collect the scope and schedule supplied by each contracted vendor.'),
  task('load-in', 'Confirm vendor load-in slots', 'VENDOR_COORDINATION', -3, 'Confirm arrival slots and loading access with the venue and vendors.'),
  task('power-check', 'Check power and equipment readiness', 'VENUE', -2, 'Review the venue power plan and vendor equipment requirements.'),
  task('vendor-brief', 'Brief vendors on the approved run sheet', 'VENDOR_COORDINATION', -1, 'Give vendors the approved timings and named escalation contact.'),
  task('guest-count', 'Confirm final guest count with the client', 'GUEST_COORDINATION', -5, 'Record the client-approved final count for execution.'),
  task('guest-transport', 'Confirm guest transport timings', 'GUEST_COORDINATION', -3, 'Verify the client or transport vendor arrival and departure plan.'),
  task('hospitality-brief', 'Brief hospitality coordinators', 'GUEST_COORDINATION', -1, 'Review welcome, help desk and guest support responsibilities.'),
  task('family-cues', 'Review family movement cues', 'GUEST_COORDINATION', -1, 'Confirm family contacts and agreed assembly points.'),
  task('mehendi-space', 'Check Mehendi execution space', 'MEHENDI', -1, 'Check access, lighting and artist stations against the approved plan.', 'MEHENDI'),
  task('mehendi-arrival', 'Confirm Mehendi artist arrival', 'MEHENDI', 0, 'Confirm the contracted artist check-in and readiness time.', 'MEHENDI'),
  task('mehendi-brief', 'Brief Mehendi guest coordinators', 'MEHENDI', 0, 'Assign guest support contacts for the Mehendi function.', 'MEHENDI'),
  task('sangeet-audio', 'Check Sangeet sound readiness', 'SANGEET', -1, 'Verify sound-check completion with the contracted production team.', 'SANGEET'),
  task('sangeet-cues', 'Review Sangeet performance cues', 'SANGEET', -1, 'Review the client-approved cue order and responsible coordinator.', 'SANGEET'),
  task('sangeet-ready', 'Confirm Sangeet vendor readiness', 'SANGEET', 0, 'Check that production and photography contacts are ready.', 'SANGEET'),
  task('reception-layout', 'Review the approved Reception floor plan', 'RECEPTION', -2, 'Review the supplied layout for access and vendor coordination.', 'RECEPTION'),
  task('reception-food', 'Confirm Reception food-service timing', 'RECEPTION', -1, 'Confirm the selected caterer service schedule.', 'RECEPTION'),
  task('reception-photo', 'Confirm Reception photography cues', 'RECEPTION', 0, 'Review entry, family photo and stage photography cues.', 'RECEPTION'),
  task('rehearsal-handover', 'Review rehearsal notes supplied by the client', 'REHEARSAL', -1, 'Review existing rehearsal notes and flag unresolved execution questions.'),
  task('cue-briefing', 'Brief coordinators on ceremony cues', 'REHEARSAL', -1, 'Walk coordinators through the final approved ceremony cue sheet.'),
  task('command-check', 'Check command-centre contact access', 'EXECUTION', -1, 'Ensure assigned staff can access current schedules and contact details.'),
  task('staff-briefing', 'Run the wedding-day staff briefing', 'EXECUTION', 0, 'Confirm owners, escalation routes and shift responsibilities.'),
  task('arrival-escalation', 'Review vendor arrival escalation rules', 'EXECUTION', 0, 'Confirm who follows up with vendors whose arrival is late.'),
  task('incident-contacts', 'Verify incident response contacts', 'EXECUTION', -1, 'Check venue, transport and emergency response contact information.'),
  task('handover-close', 'Collect end-of-function vendor handovers', 'EXECUTION', 0, 'Collect operational handovers without marking payments as settled.'),
  task('site-close', 'Confirm venue clearance and client handover', 'EXECUTION', 1, 'Check operational clearance with the venue and client contact.'),
];
const full: TaskTemplate[] = [
  task('venue-shortlist', 'Prepare the venue shortlist', 'VENUE', -120, 'Compare venue options against client requirements and budget.'),
  task('venue-confirm', 'Confirm venue booking requirements', 'VENUE', -100, 'Coordinate approved venue booking terms with the client.'),
  task('design-brief', 'Prepare the wedding design brief', 'DESIGN', -90, 'Collect approved theme, colour and decor requirements.'),
  task('design-approval', 'Obtain client design approval', 'DESIGN', -60, 'Record approval of the final design direction.'),
  task('design-vendors', 'Coordinate design vendor requirements', 'DESIGN', -45, 'Translate the approved design into vendor execution requirements.'),
  task('vendor-scope', 'Finalize vendor scope comparison', 'VENDOR_COORDINATION', -60, 'Review quotations and contracted scope with the planning lead.'),
  task('guest-planning', 'Prepare the guest coordination plan', 'GUEST_COORDINATION', -45, 'Coordinate guest support, transport and hospitality requirements.'),
  task('rehearsal-plan', 'Schedule the ceremony rehearsal', 'REHEARSAL', -14, 'Agree the rehearsal attendance and cue review with the client.'),
];
const dayOf: TaskTemplate[] = [
  task('client-plan-intake', 'Receive the client-completed planning handover', 'EXECUTION', -14, 'Receive the plans and contracts already arranged by the client.'),
  task('client-scope-check', 'Check Day-of scope and exclusions', 'VENDOR_COORDINATION', -10, 'Confirm execution responsibilities without taking on design or procurement.'),
  task('client-final-review', 'Review outstanding execution gaps with the client', 'EXECUTION', -3, 'Review unresolved execution issues in the supplied plan.'),
];
/**
 * Resolves task generation templates according to wedding package tier (ROYAL_HERITAGE, PALACE_SIGNATURE, BESPOKE_SPLENDOR).
 */
export function templatesFor(packageType: PackageType) {
  return { version: packageType === 'FULL_SERVICE' ? 'full-service.v1' : 'partial-day-of.v1', tasks: [...execution, ...(packageType === 'FULL_SERVICE' ? full : dayOf)] };
}
