-- =============================================
-- GIGSTACK — Timur's REAL Trip Data
-- Parsed directly from Uber Eats PDF statements
-- 4 weeks: Jan 5 – Feb 2, 2026
-- Run in Supabase SQL Editor
-- =============================================

-- Clear existing fake data first
DELETE FROM trips;
DELETE FROM earnings_weeks;

-- =============================================
-- EARNINGS WEEKS (from PDF summaries)
-- =============================================
INSERT INTO earnings_weeks (week_start, week_end, base_pay, tips, prop22, instant_pay_fees, deliveries, platform) VALUES
('2026-01-05', '2026-01-12', 94.75,  112.14, 32.58,  8.75, 0, 'Uber Eats'),
('2026-01-12', '2026-01-19', 179.90, 196.30, 0,      8.75, 0, 'Uber Eats'),
('2026-01-19', '2026-01-26', 165.88, 151.86, 174.13, 8.75, 0, 'Uber Eats'),
('2026-01-26', '2026-02-02', 67.54,  85.68,  0,      3.75, 0, 'Uber Eats');

-- =============================================
-- TRIPS
-- Parsed from transaction logs in each PDF
-- Each "Delivery" row = base fare
-- Tips matched to same delivery by time
-- delivery_time = when trip actually occurred
-- =============================================

-- =============================================
-- WEEK 1: Jan 5 – Jan 12, 2026
-- Total earnings: $254.56 (base $94.75 + tips $112.14 + prop22 $32.58)
-- =============================================

-- Tue Jan 6 – multiple deliveries
-- Delivery @ 3:53 PM = $13.02 base, tip $3.77 (posted 5:42PM) + tip $3.25 (posted 5:57PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-06', 'Delivery', 'Hollywood', 'Uber Eats', 13.02, 7.02);

-- Delivery @ 5:25 PM = $9.00 base, tip $26.14 (posted 7:14PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-06', 'Delivery', 'Hollywood', 'Uber Eats', 9.00, 26.14);

-- Delivery @ 7:47 PM = $2.13 base, tip $5.00 (posted 9:11PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-06', 'Delivery', 'Hollywood', 'Uber Eats', 2.13, 5.00);

-- Delivery @ 8:49 PM = $5.45 base, tip $14.32 (posted 10:22PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-06', 'Delivery', 'Hollywood', 'Uber Eats', 5.45, 14.32);

-- Delivery @ 9:40 PM = $2.24 base, tip $4.00 (posted 10:58PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-06', 'Delivery', 'Hollywood', 'Uber Eats', 2.24, 4.00);

-- Wed Jan 7
-- Delivery @ 1:54 AM = $7.04 base, tip $1.00 (posted 3:29AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-07', 'Delivery', 'Hollywood', 'Uber Eats', 7.04, 1.00);

-- Delivery @ 3:32 PM = $22.67 base, tip $7.36 (posted 5:48PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-07', 'Delivery', 'Hollywood', 'Uber Eats', 22.67, 7.36);

-- Thu Jan 8
-- Delivery @ 1:51 PM = $2.19 base, tip $8.02 (posted 3:12PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-08', 'Delivery', 'Hollywood', 'Uber Eats', 2.19, 8.02);

-- Courier @ 5:56 PM = $15.09 + $3.00 (two courier entries, same trip)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-08', 'Courier', 'Hollywood', 'Uber Eats', 18.09, 0.00);

-- Sat Jan 10
-- Delivery @ 5:49 PM = $25.29 base, tip $5.00 (posted 8:38PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-10', 'Delivery', 'West Hollywood', 'Uber Eats', 25.29, 5.00);

-- Delivery @ 7:28 PM = $5.72 base, tip $16.48 (posted 9:16PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-10', 'Delivery', 'West Hollywood', 'Uber Eats', 5.72, 16.48);

-- Two orphan tips on Jan 10 tied to no listed delivery (6:03PM tip $7.01, 6:09PM tip $7.79)
-- These likely belong to the Jan 10 deliveries above as delayed tips
-- Already included in earnings_weeks total — skip to avoid double-count

-- =============================================
-- WEEK 2: Jan 12 – Jan 19, 2026
-- Total earnings: $376.20 (base $179.90 + tips $196.30)
-- =============================================

-- Tue Jan 13
-- Delivery @ 8:12 PM = $7.08 base, tip $7.97 (posted 9:54PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-13', 'Delivery', 'Silver Lake', 'Uber Eats', 7.08, 7.97);

-- Delivery @ 9:03 PM = $8.42 base, tip $2.00 (posted 10:45PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-13', 'Delivery', 'Silver Lake', 'Uber Eats', 8.42, 2.00);

-- Delivery @ 10:02 PM = $18.47 base, tips $9.10+$3.00+$0.69 (posted late night)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-13', 'Delivery', 'Silver Lake', 'Uber Eats', 18.47, 12.79);

-- Thu Jan 15
-- Delivery @ 2:31 PM = $3.84 base, tip $8.21 (posted 3:59PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'Hollywood', 'Uber Eats', 3.84, 8.21);

-- Delivery @ 2:54 PM = $6.57 base, tip $2.00 (posted 4:29PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'Hollywood', 'Uber Eats', 6.57, 2.00);

-- Delivery @ 3:26 PM = $3.42 base, tip $3.00 (posted 4:42PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'Hollywood', 'Uber Eats', 3.42, 3.00);

-- Delivery @ 3:45 PM = $3.33 base, tip $5.00 (posted 5:11PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'Hollywood', 'Uber Eats', 3.33, 5.00);

-- Delivery @ 7:09 PM = $5.56 base, tip $10.00 (posted 8:44PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'West Hollywood', 'Uber Eats', 5.56, 10.00);

-- Delivery @ 7:34 PM = $18.64 base, tips $12.80+$8.69+$5.45 (multiple tips for big order)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'West Hollywood', 'Uber Eats', 18.64, 26.94);

-- Thu Jan 15 night / Fri Jan 16 early AM
-- Delivery @ 10:26 PM = $15.75 base, tip $2.00 (posted 12:17AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'DTLA', 'Uber Eats', 15.75, 2.00);

-- Delivery @ 11:32 PM = $5.16 base, tips $3.60+$5.71 (posted 1:06AM+12:58AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-15', 'Delivery', 'DTLA', 'Uber Eats', 5.16, 9.31);

-- Delivery @ 11:38 PM (same night, separate trip) — tip $13.29 posted 12:10AM
-- NOTE: No base listed separately — likely bundled. Tip only recorded.
-- Skip base to avoid duplication; tip captured in earnings_weeks

-- Fri Jan 16 early AM
-- Delivery @ 12:22 AM = $3.03 base, tip $3.00 (posted 1:43AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-16', 'Delivery', 'DTLA', 'Uber Eats', 3.03, 3.00);

-- Sat Jan 17 early AM
-- Delivery @ 12:06 AM = $3.28 base, tip $5.76 (posted 1:21AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'Hollywood', 'Uber Eats', 3.28, 5.76);

-- Delivery @ 12:11 AM = $15.07 base, tip $4.00 (posted 1:39AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'Hollywood', 'Uber Eats', 15.07, 4.00);

-- Delivery @ 1:12 AM = $6.10 base, tips $5.00+$5.00 (posted 2:56AM+3:05AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'Hollywood', 'Uber Eats', 6.10, 10.00);

-- Delivery @ 1:58 AM = $23.32 base, tips $3.89+$4.00 (posted 3:29AM+3:51AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'Hollywood', 'Uber Eats', 23.32, 7.89);

-- Sat Jan 17 late AM tip only $2.00 @ 4:18AM for trip @ 2:23AM — add as separate entry
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'Hollywood', 'Uber Eats', 0.00, 2.00);

-- Sat Jan 17 evening
-- Delivery @ 4:46 PM = $21.54 base, tips $4.00+$4.00 (posted 6:59PM+7:06PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'West Hollywood', 'Uber Eats', 21.54, 8.00);

-- Delivery @ 5:50 PM = $6.70 base, tip $28.21 (posted 7:49PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-17', 'Delivery', 'West Hollywood', 'Uber Eats', 6.70, 28.21);

-- Sun Jan 18
-- Delivery @ 4:28 PM = $4.62 base, tip $15.39 (posted 5:58PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-18', 'Delivery', 'West Hollywood', 'Uber Eats', 4.62, 15.39);

-- =============================================
-- WEEK 3: Jan 19 – Jan 26, 2026
-- Total earnings: $491.87 (base $165.88 + tips $151.86 + prop22 $174.13)
-- =============================================

-- Mon Jan 19
-- Delivery @ 5:19 PM = $25.30 base, tips $3.54+$8.17 (posted 7:32PM+7:40PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 25.30, 11.71);

-- Delivery @ 7:34 PM = $4.35 base, tip $4.80 (posted 9:02PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 4.35, 4.80);

-- Delivery @ 8:16 PM = $4.51 base, tip $1.00 (posted 9:33PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 4.51, 1.00);

-- Delivery @ 8:38 PM = $5.14 base, tip $6.00 (posted 10:13PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 5.14, 6.00);

-- Delivery @ 8:47 PM (tip only $3.00 posted 10:22PM — no separate base listed, tip only)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 0.00, 3.00);

-- Delivery @ 9:20 PM = $11.82 base, tips $3.00+$4.82 (posted 11:08PM+10:42PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 11.82, 7.82);

-- Delivery @ 9:20 PM (2nd simultaneous) = $5.23 base
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 5.23, 0.00);

-- Delivery @ 10:05 PM = $4.68 base, tip $5.00 (posted 11:35PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 4.68, 5.00);

-- Delivery @ 10:42 PM = $6.15 base, tips $1.50+$1.50 (posted 12:18AM+12:18AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 6.15, 3.00);

-- Delivery @ 10:35 PM = $2.40 base, tip $9.42 (posted 11:49PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 2.40, 9.42);

-- Delivery @ 11:17 PM = $12.42 base, tip $6.65 (posted Jan 20 1:10AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-19', 'Delivery', 'Hollywood', 'Uber Eats', 12.42, 6.65);

-- Tue Jan 20
-- Delivery @ 6:16 PM = $30.09 base, tips $16.00+$12.50+$7.50 (posted 8:32PM+8:52PM+8:13PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-20', 'Delivery', 'West Hollywood', 'Uber Eats', 30.09, 36.00);

-- Delivery @ 8:07 PM = $2.30 base, tip $5.75 (posted 9:23PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-20', 'Delivery', 'West Hollywood', 'Uber Eats', 2.30, 5.75);

-- Thu Jan 22
-- Delivery @ 7:23 PM = $5.28 base, tip $4.32 (posted 8:59PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-22', 'Delivery', 'Hollywood', 'Uber Eats', 5.28, 4.32);

-- Delivery @ 7:48 PM = $8.30 base, tip $4.78 (posted 9:30PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-22', 'Delivery', 'Hollywood', 'Uber Eats', 8.30, 4.78);

-- Delivery @ 10:00 PM = $6.63 base, tip $4.00 (posted 11:44PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-22', 'Delivery', 'Hollywood', 'Uber Eats', 6.63, 4.00);

-- Fri Jan 23 (early AM)
-- Delivery @ 11:27 PM = $14.11 base, tip $19.92 (posted 1:13AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-22', 'Delivery', 'Hollywood', 'Uber Eats', 14.11, 19.92);

-- Sat Jan 24
-- Delivery @ 9:58 PM = $4.69 base, tip $14.69 (posted 11:37PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-24', 'Delivery', 'Hollywood', 'Uber Eats', 4.69, 14.69);

-- Delivery @ 11:08 PM = $12.48 base, tips $1.00+$3.00 (posted Jan 25 12:51AM+12:43AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-24', 'Delivery', 'Hollywood', 'Uber Eats', 12.48, 4.00);

-- =============================================
-- WEEK 4: Jan 26 – Feb 2, 2026
-- Total earnings: $153.22 (base $67.54 + tips $85.68)
-- =============================================

-- Thu Jan 29
-- Delivery @ 3:00 PM = $3.05 base, tip $4.99 (posted 4:24PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-29', 'Delivery', 'Hollywood', 'Uber Eats', 3.05, 4.99);

-- Delivery @ 3:19 PM = $3.84 base, tip $5.62 (posted 4:42PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-29', 'Delivery', 'Hollywood', 'Uber Eats', 3.84, 5.62);

-- Delivery @ 3:34 PM = $9.02 base, tip $3.00 (posted 4:05PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-29', 'Delivery', 'Hollywood', 'Uber Eats', 9.02, 3.00);

-- Delivery @ 3:40 PM (tip $3.00 posted 5:17PM) — tip only, bundled delivery
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-29', 'Delivery', 'Hollywood', 'Uber Eats', 0.00, 3.00);

-- Delivery @ 3:51 PM (tip $3.00 posted 5:11PM) — tip only, bundled delivery
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-29', 'Delivery', 'Hollywood', 'Uber Eats', 0.00, 3.00);

-- Sat Jan 31
-- Delivery @ 5:41 PM = $4.42 base (no tip listed)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 4.42, 0.00);

-- Delivery @ 6:11 PM = $4.60 base, tip $8.00 (posted 7:38PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 4.60, 8.00);

-- Delivery @ 6:42 PM = $7.60 base, tip $9.66 (posted 7:15PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 7.60, 9.66);

-- Delivery @ 6:48 PM = $7.77 base, tips $3.50+$4.80 (posted 8:32PM+8:44PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 7.77, 8.30);

-- Delivery @ 7:19 PM = $12.04 base, tips $4.00+$4.00 (posted 9:06PM+7:48PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 12.04, 8.00);

-- Delivery @ 8:37 PM = $4.48 base, tip $15.93 (posted 10:05PM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 4.48, 15.93);

-- Delivery @ 8:40 PM = separate tip $2.22 (posted 9:55PM) — tip only
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-01-31', 'Delivery', 'Hollywood', 'Uber Eats', 0.00, 2.22);

-- Sun Feb 1
-- Delivery @ 11:00 PM = $3.62 base, tip $5.01 (posted Feb 2 12:23AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-02-01', 'Delivery', 'Hollywood', 'Uber Eats', 3.62, 5.01);

-- Delivery @ 11:27 PM = $3.01 base, tip $5.00 (posted Feb 2 12:51AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-02-01', 'Delivery', 'Hollywood', 'Uber Eats', 3.01, 5.00);

-- Delivery @ 11:48 PM = $4.09 base, tip $3.95 (posted Feb 2 1:03AM)
INSERT INTO trips (date, restaurant_name, zone, platform, earnings, tip) VALUES
('2026-02-01', 'Delivery', 'Hollywood', 'Uber Eats', 4.09, 3.95);
