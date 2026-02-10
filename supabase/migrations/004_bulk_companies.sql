-- 004_bulk_companies.sql
-- Bulk insert all portfolio companies.
-- Uses ON CONFLICT (slug) DO UPDATE to be safely re-runnable.

-- First, remove seed companies that are not real portfolio companies
DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE slug IN ('acme-corp', 'globex', 'initech', 'unwrap'));
DELETE FROM snapshots WHERE company_id IN (SELECT id FROM companies WHERE slug IN ('acme-corp', 'globex', 'initech', 'unwrap'));
DELETE FROM clicks WHERE company_id IN (SELECT id FROM companies WHERE slug IN ('acme-corp', 'globex', 'initech', 'unwrap'));
DELETE FROM companies WHERE slug IN ('acme-corp', 'globex', 'initech', 'unwrap');

-- Insert portfolio companies
INSERT INTO companies (name, slug, careers_url, homepage_url, enabled) VALUES
  ('Designalytics', 'designalytics', 'https://www.designalytics.com/careers', 'https://www.designalytics.com/', true),
  ('Cloverleaf', 'cloverleaf', 'https://careers.cloverleaf.me/', 'https://cloverleaf.me/', true),
  ('FreightPOP', 'freightpop', 'https://www.freightpop.com/careers', 'https://www.freightpop.com/', true),
  ('Tovuti', 'tovuti', 'https://www.tovutilms.com/careers', 'https://www.tovutilms.com/', true),
  ('Snag', 'snag', NULL, 'https://snagdelivery.app/', true),
  ('Guava', 'guava', 'https://guavahealth.com/careers', 'https://guavahealth.com/', true),
  ('HeyTutor', 'heytutor', NULL, 'https://heytutor.com/', true),
  ('Voyager', 'voyager', NULL, 'https://www.voyagerportal.com/', true),
  ('FLIP', 'flip', 'https://job-boards.greenhouse.io/flip', 'https://flipcx.com/', true),
  ('Yogi', 'yogi', 'https://www.meetyogi.com/careers#scroll-to', 'https://www.meetyogi.com/', true),
  ('Pearly', 'pearly', 'https://www.pearly.co/careers', 'https://www.pearly.co/', true),
  ('Aavenir', 'aavenir', 'https://aavenir.com/jobs/', 'https://aavenir.com/', true),
  ('Unwrap', 'unwrap', 'https://jobs.ashbyhq.com/Unwrap', 'https://www.unwrap.ai/', true),
  ('BuyerCaddy', 'buyercaddy', NULL, 'https://buyercaddy.com/', true),
  ('Userpilot', 'userpilot', 'https://userpilot.bamboohr.com/careers', 'https://userpilot.com/', true),
  ('Rogo', 'rogo', 'https://rogo.ai/careers#roles', 'https://rogo.ai/', true),
  ('Customers.ai', 'customers', 'https://customers.ai/jobs', 'https://customers.ai/', true),
  ('FoodReady', 'foodready', 'https://foodready.ai/jobs/', 'https://foodready.ai/', true),
  ('HealthArc', 'healtharc', 'https://www.naukri.com/healtharc-jobs-careers-124231516', 'https://www.healtharc.io/', true),
  ('ChipAgents', 'chipagents', 'https://chipagents.ai/careers', 'https://chipagents.ai/', true),
  ('PromptLayer', 'promptlayer', 'https://www.promptlayer.com/careers', 'https://promptlayer.com/', true),
  ('SuiteOp', 'suiteop', 'https://wellfound.com/company/suiteophq', 'https://suiteop.com/', true),
  ('SmartBarrel', 'smartbarrel', 'https://smartbarrel.io/careers/#jobslisting', 'https://smartbarrel.io/', true),
  ('Pangram', 'pangram', 'https://jobs.ashbyhq.com/pangramlabs', 'https://www.pangram.com/', true),
  ('Lifeguard', 'lifeguard', NULL, 'https://www.trylifeguard.com/', true),
  ('Fewshot', 'fewshot', NULL, 'https://few.sh/', true),
  ('Spacture', 'spacture', NULL, 'https://www.spacture.ai/', true),
  ('Artiphishell', 'artiphishell', NULL, 'https://artiphishell.com/', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  careers_url = EXCLUDED.careers_url,
  homepage_url = EXCLUDED.homepage_url;
