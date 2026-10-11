import { describe, it, expect } from 'vitest'
import { seed, SHOCKS } from '../seed'
import { summary, fmt, BUDGET, DAYS, PRIOR_BURN, PRIOR_WEIGHT } from '../selectors'
import { apply, simulate, nextDay, charge, advanceTo, simulateWait } from '../simulate'
import type { State, Decision } from '../types'

describe('Domain: summary()', () => {
  it('calculates safe-to-spend correctly on initial seed', () => {
    const s = seed()
    const sum = summary(s)

    // Dues = Hostel mess (3000) + Phone (299) + EMI (800) + Netflix (199) + Spotify (119) + Gym (499) = 4916
    const expectedDues = 3000 + 299 + 800 + 199 + 119 + 499
    expect(s.balance).toBe(9820)
    expect(sum.safe).toBe(9820 - expectedDues) // 4904
    expect(sum.daysLeft).toBe(30)
    expect(sum.allowance).toBeCloseTo(4904 / 30, 2)
  })

  it('deducts remaining days of daily habits from safe-to-spend', () => {
    const s: State = {
      ...seed(),
      habits: [{ id: 99, label: 'Chai', perDay: 50 }]
    }
    // On day 1, remaining days = 30 - 1 = 29
    const sum = summary(s)
    const baseSafe = 9820 - 4916
    expect(sum.safe).toBe(baseSafe - 50 * 29)
  })

  it('health score weights sum exactly to 1.0', () => {
    const s = seed()
    const sum = summary(s)
    const totalWeight = sum.parts.reduce((acc, p) => acc + p.weight, 0)
    expect(totalWeight).toBeCloseTo(1.0, 5)
  })

  it('health score is clamped between 0 and 100', () => {
    const normal = summary(seed())
    expect(normal.health).toBeGreaterThanOrEqual(0)
    expect(normal.health).toBeLessThanOrEqual(100)

    // Extreme negative state
    const broke: State = {
      ...seed(),
      balance: -10000,
      txs: [{ id: 1, day: 1, amount: 20000, cat: 'Shopping', label: 'Overspending', need: false }]
    }
    const brokeSum = summary(broke)
    expect(brokeSum.health).toBeGreaterThanOrEqual(0)
    expect(brokeSum.health).toBeLessThanOrEqual(100)
    expect(Number.isNaN(brokeSum.health)).toBe(false)
  })

  it('determines risk thresholds accurately (Low, Watch, High, Critical)', () => {
    // Low risk: expected month-end >= 10% of budget (1000)
    const sLow = seed()
    expect(summary(sLow).risk).toBe('Low')

    // Watch risk: 0 <= expected month-end < 1000
    // Initial safe is 4904, burn is 120, end.exp = 4904 - 120*30 = 1304.
    // If we add an expense of 800, safe becomes 4104, end.exp becomes ~504 (between 0 and 1000)
    const sWatch = charge(seed(), 800, 'Shock', 'Doctor', true, true)
    expect(summary(sWatch).risk).toBe('Watch')

    // High risk: end.exp < 0 but runway >= 0.6
    // If safe drops to ~2500, runway = 2500 / (120*30) = 2500 / 3600 = ~0.69 >= 0.6
    const sHigh = charge(seed(), 2400, 'Shock', 'Repair', true, true)
    const sumHigh = summary(sHigh)
    expect(sumHigh.end.exp).toBeLessThan(0)
    expect(sumHigh.risk).toBe('High')

    // Critical risk: runway < 0.6
    // If safe drops to ~1000, runway = 1000 / 3600 = ~0.27 < 0.6
    const sCritical = charge(seed(), 4000, 'Shock', 'Disaster', true, true)
    expect(summary(sCritical).risk).toBe('Critical')
  })
})

describe('Domain: apply() and simulate() equivalence', () => {
  const decisions: Decision[] = [
    { kind: 'purchase', label: 'Sneakers', amount: 800, cat: 'Shopping', need: false },
    { kind: 'subscription', label: 'iCloud', amount: 75 },
    { kind: 'habit', label: 'Juice', perDay: 40 },
    { kind: 'pauseSub', id: 13 }, // Netflix
    { kind: 'goal', id: 20, amount: 300 }, // Goa trip
    { kind: 'shock', label: 'Medical', amount: 1200 }
  ]

  for (const d of decisions) {
    it(`guarantees preview (simulate) matches commit (apply) for kind: ${d.kind}`, () => {
      const s = seed()
      const preview = simulate(s, d)
      const committed = apply(s, d)
      const committedSummary = summary(committed)

      expect(preview.after.safe).toBe(committedSummary.safe)
      expect(preview.after.allowance).toBe(committedSummary.allowance)
      expect(preview.after.burn).toBe(committedSummary.burn)
      expect(preview.after.risk).toBe(committedSummary.risk)
      expect(preview.after.health).toBe(committedSummary.health)
      expect(preview.after.end).toEqual(committedSummary.end)
      expect(preview.after.goalMonths).toEqual(committedSummary.goalMonths)
    })
  }
})

describe('Domain: nextDay() progression', () => {
  it('charges bills exactly on their due dates', () => {
    let s = seed()

    // Days 1 to 4: no bills due yet
    for (let d = 1; d < 5; d++) {
      s = nextDay(s)
    }
    expect(s.day).toBe(5)
    // On transition to day 5, Hostel mess share (₹3000) should be charged and marked paid
    const messBill = s.bills.find(b => b.id === 10)
    expect(messBill?.paid).toBe(true)
    expect(s.txs.some(t => t.day === 5 && t.amount === 3000 && t.label === 'Hostel mess share')).toBe(true)
    expect(s.balance).toBe(9820 - 3000)

    // Advance to day 10: Phone recharge (₹299, id: 11) is due
    for (let d = 5; d < 10; d++) {
      s = nextDay(s)
    }
    expect(s.day).toBe(10)
    const phoneBill = s.bills.find(b => b.id === 11)
    expect(phoneBill?.paid).toBe(true)
    expect(s.balance).toBe(9820 - 3000 - 299)
  })

  it('charges active daily habits every day', () => {
    let s = apply(seed(), { kind: 'habit', label: 'Coffee', perDay: 40 })

    // Advance 3 days (day 1 -> day 4)
    s = nextDay(s) // day 2
    s = nextDay(s) // day 3
    s = nextDay(s) // day 4
    expect(s.day).toBe(4)

    const coffeeTxs = s.txs.filter(t => t.cat === 'Habit' && t.label === 'Coffee')
    expect(coffeeTxs.length).toBe(3)
    expect(coffeeTxs.reduce((sum, t) => sum + t.amount, 0)).toBe(120)
  })

  it('does not charge paused subscriptions on their due date', () => {
    let s = seed()
    // Netflix is due on day 12 (id: 13)
    // Pause Netflix on day 1
    s = apply(s, { kind: 'pauseSub', id: 13 })
    const netflixBefore = s.bills.find(b => b.id === 13)
    expect(netflixBefore?.active).toBe(false)

    // Advance past day 12 to day 13
    for (let d = 1; d <= 12; d++) {
      s = nextDay(s)
    }
    expect(s.day).toBe(13)

    const netflixAfter = s.bills.find(b => b.id === 13)
    expect(netflixAfter?.paid).toBe(false)
    expect(s.txs.some(t => t.label === 'Netflix')).toBe(false)
  })
})

describe('Domain: Edge cases', () => {
  it('stops advancing at day 30', () => {
    let s = seed()
    for (let d = 1; d < 30; d++) {
      s = nextDay(s)
    }
    expect(s.day).toBe(30)
    const s30 = nextDay(s)
    expect(s30.day).toBe(30)
    expect(s30).toEqual(s)
  })

  it('handles day 30 math: allowance equals safe, remaining habit days is 0', () => {
    let s: State = { ...seed(), day: 30, habits: [{ id: 1, label: 'Tea', perDay: 20 }] }
    const sum = summary(s)
    expect(sum.daysLeft).toBe(1)
    expect(sum.allowance).toBe(Math.max(0, sum.safe))
    // (DAYS - s.day) = 30 - 30 = 0, so habit component is 0 and safe is exactly balance - dues
    const dues = 3000 + 299 + 800 + 199 + 119 + 499
    expect(sum.safe).toBe(s.balance - dues)
  })

  it('handles negative balance gracefully without crashing or returning NaN', () => {
    const s: State = { ...seed(), balance: -1500 }
    const sum = summary(s)
    expect(sum.safe).toBeLessThan(0)
    expect(sum.allowance).toBe(0) // allowance is Math.max(0, safe) / daysLeft
    expect(sum.risk).toBe('Critical')
    expect(Number.isNaN(sum.health)).toBe(false)
    expect(sum.health).toBeGreaterThanOrEqual(0)
  })

  it('marks ETA as Infinity when goal cannot be reached with zero or negative surplus', () => {
    // Force end.exp + savedTot <= 0
    const s: State = {
      ...seed(),
      balance: 100, // Very low balance
      goals: [{ id: 1, name: 'Bike', target: 5000, saved: 0, monthly: 1000 }]
    }
    const sum = summary(s)
    expect(sum.goalMonths[1]).toBe(Infinity)
  })

  it('marks ETA as 0 when goal target is already reached or exceeded', () => {
    const s: State = {
      ...seed(),
      goals: [
        { id: 1, name: 'Laptop', target: 5000, saved: 5000, monthly: 1000 },
        { id: 2, name: 'Trip', target: 3000, saved: 3500, monthly: 1000 }
      ]
    }
    const sum = summary(s)
    expect(sum.goalMonths[1]).toBe(0)
    expect(sum.goalMonths[2]).toBe(0)
  })

  it('formats positive, negative, and zero amounts correctly', () => {
    expect(fmt(1500)).toBe('₹1,500')
    expect(fmt(-850)).toBe('-₹850')
    expect(fmt(0)).toBe('₹0')
  })

  it('rejects goal payments when goal id does not exist without losing balance', () => {
    const s = seed()
    const invalidGoalDecision: Decision = { kind: 'goal', id: 9999, amount: 500 }
    const res = apply(s, invalidGoalDecision)
    expect(res.balance).toBe(s.balance)
  })
})

describe('Domain: Bug regression tests', () => {
  it('leaves burn unchanged at ₹120/day after a ₹1,500 one-off purchase', () => {
    const s0 = seed()
    const before = summary(s0)
    expect(Math.round(before.burn)).toBe(120)

    const sAfter = apply(s0, { kind: 'purchase', label: 'Sneakers', amount: 1500, cat: 'Shopping', need: false })
    const after = summary(sAfter)

    // Burn rate remains unchanged at 120/day
    expect(Math.round(after.burn)).toBe(120)
    expect(after.burn).toBe(before.burn)
  })

  it('lowers health score from the one-off purchase (proving nonFixed scoring works)', () => {
    const s0 = seed()
    const before = summary(s0)

    const sAfter = apply(s0, { kind: 'purchase', label: 'Sneakers', amount: 1500, cat: 'Shopping', need: false })
    const after = summary(sAfter)

    // Proves nonFixed includes the purchase: health score drops and runway coverage is reduced
    expect(after.health).toBeLessThan(before.health)
    const runwayBefore = before.parts.find(p => p.label === 'Runway coverage')!
    const runwayAfter = after.parts.find(p => p.label === 'Runway coverage')!
    expect(runwayAfter.score).toBeLessThan(runwayBefore.score)
  })

  it('raises burn rate when a ₹500 Shopping expense is logged (ensuring oneOff stays off for Spend-tab entries)', () => {
    const s0 = seed()
    const before = summary(s0)
    expect(Math.round(before.burn)).toBe(120)

    // Regular logged expense from Spend tab: charge() called without oneOff=true
    const sLogged = charge(s0, 500, 'Shopping', 'T-shirt', false)
    const after = summary(sLogged)

    // Burn rate increases from 120/day to 245/day: (180 + 500 + 300) / 4 = 245
    expect(after.burn).toBeGreaterThan(before.burn)
    expect(Math.round(after.burn)).toBe(245)
  })

  it('does not produce a "Slows" verdict when contributing to a goal', () => {
    const s0 = seed()
    // Goal 20 is "Goa trip fund"
    const sim = simulate(s0, { kind: 'goal', id: 20, amount: 500 })

    expect(sim.verdict).not.toContain('Slows')
    expect(sim.verdict).not.toContain('Slows: Goa trip fund')
    // Pacing improves or stays the same
    expect(sim.after.goalMonths[20]).toBeLessThanOrEqual(sim.before.goalMonths[20])
  })

  it('leaves balance untouched when applying a goal decision with a stale ID (such as a subscription ID)', () => {
    const s0 = seed()
    const staleSubId = 13 // Netflix subscription id in seed.bills
    expect(s0.bills.some(b => b.id === staleSubId)).toBe(true)
    expect(s0.goals.some(g => g.id === staleSubId)).toBe(false)

    const sAfter = apply(s0, { kind: 'goal', id: staleSubId, amount: 500 })

    // Balance remains unchanged; no money lost
    expect(sAfter.balance).toBe(s0.balance)
    expect(sAfter.goals).toEqual(s0.goals)
  })
})

describe('Domain: advanceTo() and simulateWait()', () => {
  it('advances cleanly to day X, charging intermediate bills and projecting everyday spend at burn rate', () => {
    const s0 = seed()
    const s6 = advanceTo(s0, 6)
    expect(s6.day).toBe(6)
    // Hostel mess share due on day 5 (3000) should be charged and marked paid
    const messBill = s6.bills.find(b => b.id === 10)
    expect(messBill?.paid).toBe(true)
    // 5 days of advancement with 120/day projected burn + 3000 bill
    expect(s6.balance).toBe(9820 - 3000 - 5 * 120)
  })

  it('demonstrates month-end forecast is identical whether buying now or waiting (endNow and endLater match to the rupee)', () => {
    const s0 = seed()
    const purchase: Decision = { kind: 'purchase', label: 'Sneakers', amount: 1500, cat: 'Shopping', need: false }
    const w6 = simulateWait(s0, purchase, 6)
    const w16 = simulateWait(s0, purchase, 16)

    // endNow and endLater match to the rupee
    expect(w6.endNow).toBeCloseTo(w6.endLater, 0)
    expect(w16.endNow).toBeCloseTo(w16.endLater, 0)
    expect(w6.endLater).toBeCloseTo(-196, 0)
    expect(w16.endLater).toBeCloseTo(-196, 0)

    // Cleared dues are accurately tracked
    expect(w6.cleared.some(b => b.name === 'Hostel mess share' && b.amount === 3000)).toBe(true)
  })
})


