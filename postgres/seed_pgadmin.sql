-- Creative OS — Local PostgreSQL / pgAdmin seed
-- Run AFTER schema_pgadmin.sql inside creative_os_db.

begin;

-- Stable demo admin user for local development. Authentication is not yet enforced by the browser app.
insert into public.app_users (id,email,display_name,status)
values ('10000000-0000-0000-0000-000000000001','admin@creative-os.local','Creative OS Admin','active')
on conflict (id) do update set email=excluded.email, display_name=excluded.display_name, status=excluded.status;

insert into public.workspaces (id,name,slug,created_by)
values ('00000000-0000-0000-0000-000000000001','Creative OS Demo','creative-os-demo','10000000-0000-0000-0000-000000000001')
on conflict (id) do update set name=excluded.name, slug=excluded.slug, created_by=excluded.created_by;

insert into public.workspace_members (workspace_id,user_id,role)
values ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','owner')
on conflict (workspace_id,user_id) do update set role=excluded.role;

insert into public.brands (id,workspace_id,name,category,positioning,brand_promise,differentiator,tone,visual_identity,guardrails,created_by)
values (
  'PF','00000000-0000-0000-0000-000000000001','Pur’ Ferme Project','Functional foods',
  'Clean-label, health-first everyday nutrition','Health first. Always.','Clean label backed by traceability',
  'Premium, intelligent, calm, modern, assured, warm',
  '{"primary":"#36013F","secondary":"#FBF3E3","heading_font":"EB Garamond","body_font":"Inter"}',
  '{"avoid":["biscuits as primary term","cheap/cheapest","miracle claims","medical claims without evidence","guilt-free overuse","fear parenting"]}',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set
  workspace_id=excluded.workspace_id,
  positioning=excluded.positioning,
  tone=excluded.tone,
  visual_identity=excluded.visual_identity,
  guardrails=excluded.guardrails;

insert into public.products (id,workspace_id,brand_id,name,sku,mrp,selling_price,pack_size,product_truth,claims_allowed,claims_prohibited,status,created_by)
values (
  'PF-COOKIE-BRK','00000000-0000-0000-0000-000000000001','PF','Millet & Oats Breakfast Cookies','Cookies_Breakfast',339,null,'240 g',
  '{"ingredients":["foxtail millet","rolled oats","jaggery","almonds","cashews","cow butter"],"facts":["no maida","no refined sugar","no palm oil","no artificial preservatives"],"usage":["breakfast accompaniment","coffee","tea","office","mid-morning","evening","travel"]}',
  '["No maida","No refined sugar","No palm oil","No artificial preservatives","Millet + oats"]',
  '["meal replacement","weight loss","disease prevention","immunity","doctor recommended","gluten-free unless verified"]','active',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set
  workspace_id=excluded.workspace_id,
  product_truth=excluded.product_truth,
  claims_allowed=excluded.claims_allowed,
  claims_prohibited=excluded.claims_prohibited;

insert into public.audiences (id,workspace_id,brand_id,name,profile) values
('PF-A01','00000000-0000-0000-0000-000000000001','PF','The 8:45 AM Mom','{"tension":"Healthy intention interrupted by morning chaos","desired":"A better choice with no prep"}'),
('PF-A02','00000000-0000-0000-0000-000000000001','PF','The Coffee Person','{"tension":"Healthy snacks can feel like a taste/aesthetic downgrade","desired":"A premium everyday ritual"}'),
('PF-A03','00000000-0000-0000-0000-000000000001','PF','The Label Reader','{"tension":"Most healthy claims look the same","desired":"Evidence and value clarity"}')
on conflict (id) do update set workspace_id=excluded.workspace_id, profile=excluded.profile;

insert into public.briefs (id,workspace_id,concept_id,hook_id,angle_id,status,objective,exact_hook,support_copy,proof_lines,cta,format,product_scale,required_assets,blockers,brief_json) values
('PF-BRIEF-001','00000000-0000-0000-0000-000000000001',null,null,null,'ready','Acquisition recognition','Breakfast had a plan. Monday had other ideas.','For mornings that move faster than planned.','["Millet + oats","No maida","No refined sugar"]','Keep better within reach','1080x1350',32,'["front_pack","cookie_reference"]','[]','{}'),
('PF-BRIEF-003','00000000-0000-0000-0000-000000000001',null,null,null,'ready','Coffee ritual upgrade','Your coffee upgraded. Did your cookie?','Bring the same standards to what sits beside it.','["Millet + oats","No maida","No refined sugar"]','Upgrade the pairing','1080x1350',30,'["front_pack","cookie_reference"]','[]','{}'),
('PF-BRIEF-004','00000000-0000-0000-0000-000000000001',null,null,null,'ready','Brand identity','Better food. Less wellness theatre.','No performance. No preach. Just a more considered everyday choice.','["No maida","No refined sugar","No palm oil"]','Just better food','1080x1350',28,'["front_pack","cookie_reference"]','[]','{}'),
('PF-BRIEF-005','00000000-0000-0000-0000-000000000001',null,null,null,'ready','Habit / ritual','Coffee. Cookie. Repeat.','Better choices stick when they fit the routine you already have.','["Coffee/tea companion","Portable"]','Make it part of the routine','1080x1350',30,'["front_pack","cookie_reference"]','[]','{}'),
('PF-BRIEF-008','00000000-0000-0000-0000-000000000001',null,null,null,'ready','Lifestyle identity','Health first. Personality intact.','Better food should fit your life—not take it over.','["Ingredient-led formulation"]','Health first, life still normal','1080x1350',25,'["front_pack","cookie_reference"]','[]','{}')
on conflict (id) do update set
  workspace_id=excluded.workspace_id,
  status=excluded.status,
  exact_hook=excluded.exact_hook,
  support_copy=excluded.support_copy,
  proof_lines=excluded.proof_lines,
  cta=excluded.cta,
  product_scale=excluded.product_scale;

insert into public.production_jobs (id,workspace_id,brief_id,version,status,environment_prompt,negative_prompt,product_instructions,composite_order,export_spec) values
('PF-JOB-001','00000000-0000-0000-0000-000000000001','PF-BRIEF-001','V1','ready','Premium editorial morning tabletop, warm cream/oat surface, soft natural morning light from upper left, coffee mug, keys, laptop edge, tote strap and half-open notebook arranged with controlled imperfection. Leave clean negative space in upper-left for headline and lower-left for proof. Lower-right must remain visually open for later product placement. Authentic premium photography, tactile, believable, warm, restrained.','No branded packaging, logos, readable text, recognizable food packs, health clichés, gym props, medical visuals, excessive green or messy kitchen.','Composite exact real front pack lower-right at 32% canvas scale and real cookie beside it.','["environment","front_pack","cookie_reference","typography","brand_ui","finish"]','{"creative_id":"PF-COOKIE-BRK-A04-H001-C001-V01","width":1080,"height":1350,"format":"png"}'),
('PF-JOB-002','00000000-0000-0000-0000-000000000001','PF-BRIEF-003','V1','ready','Split editorial tabletop from the same elevated camera angle. Left is a practical ordinary coffee setting with a neutral ceramic cup and generic unbranded snack object, flatter light. Right is warmer and refined with coffee, book edge and clean open zone for later real product placement. Keep attainable, not luxury.','No Pur’ Ferme pack, logos, readable text, competitor pack, third-party coffee branding, health clichés or humiliating before/after treatment.','Composite exact pack and cookie on right at 30% scale.','["environment","front_pack","cookie_reference","typography","brand_ui","finish"]','{"creative_id":"PF-COOKIE-BRK-A01-H013-C007-V01","width":1080,"height":1350,"format":"png"}'),
('PF-JOB-003','00000000-0000-0000-0000-000000000001','PF-BRIEF-004','V1','ready','Minimal warm cream editorial paper/studio background with extremely subtle tactile grain and soft natural shadow falloff in lower-right. Large clean negative space upper-left and centre-left. Contemporary premium print-ad feel, restrained.','No package, logo, cookie, readable text, badges, leaves, green health icons, gym elements, medical graphics, metallic gold or marketplace stickers.','Place exact front pack lower-right at 28% and real cookie beside it.','["environment","front_pack","cookie_reference","typography","brand_ui","finish"]','{"creative_id":"PF-COOKIE-BRK-A10-H021-C011-V01","width":1080,"height":1350,"format":"png"}'),
('PF-JOB-004','00000000-0000-0000-0000-000000000001','PF-BRIEF-005','V1','ready','Three visually consistent premium coffee-routine frames on the same warm tabletop: frame 1 coffee being poured into an unbranded ceramic cup; frame 2 clean empty product zone beside coffee tools; frame 3 coffee cup plus clean foreground zone for a real cookie. Same camera and warm natural light. Leave clear top and bottom bands.','No branded packaging, logos, readable text, recognizable cookie, coffee branding, arrows, motion blur, medical/fitness props or wellness clichés.','Composite exact pack into frame 2 at 30%; exact cookie into frame 3.','["environment","front_pack","cookie_reference","typography","brand_ui","finish"]','{"creative_id":"PF-COOKIE-BRK-A13-H027-C012-V01","width":1080,"height":1350,"format":"png"}'),
('PF-JOB-005','00000000-0000-0000-0000-000000000001','PF-BRIEF-008','V1','ready','Modern attainable work-from-café/home lifestyle scene in warm natural daylight: partial laptop, understated headphones, coffee cup, book or tasteful skincare object, realistic lived-in tabletop. No visible brands. Leave upper-left 40% clean and lower/mid-right open for later product placement. Premium editorial photography, culturally current and human.','No Pur’ Ferme pack, cookie, logos, readable text, third-party brands, shaker bottle, dumbbells, yoga mat, leaves, medical visuals, excessive green or glossy CGI.','Composite exact pack lower/mid-right at 25% and exact cookie nearby.','["environment","front_pack","cookie_reference","typography","brand_ui","finish"]','{"creative_id":"PF-COOKIE-BRK-A10-H019-C010-V01","width":1080,"height":1350,"format":"png"}')
on conflict (id) do update set
  workspace_id=excluded.workspace_id,
  environment_prompt=excluded.environment_prompt,
  negative_prompt=excluded.negative_prompt,
  product_instructions=excluded.product_instructions,
  export_spec=excluded.export_spec;


-- V6 expanded Pur’ Ferme catalog. Unknown commercial fields remain null instead of being invented.
insert into public.products
(id,workspace_id,brand_id,name,sku,mrp,selling_price,pack_size,product_truth,claims_allowed,claims_prohibited,status,created_by)
values
('PF-COOKIE-CHO','00000000-0000-0000-0000-000000000001','PF','Millets & Oats Chocolate Cookies',null,349,null,'240 g','{"category":"Cookies","description":"Chocolate variant of the millet-and-oats cookie range.","ingredients":[],"facts":["No maida","No refined sugar","No palm oil","No artificial preservatives","Made with foxtail millet","Made with oats","Real cocoa"],"usage":["coffee","tea","office","snacking","travel"]}','["No maida","No refined sugar","No palm oil","No artificial preservatives","Millets + oats","Real cocoa"]','["weight loss","disease prevention","immunity","doctor recommended","gluten-free unless verified"]','active','10000000-0000-0000-0000-000000000001'),
('PF-PB-PLAIN','00000000-0000-0000-0000-000000000001','PF','Unsweetened Peanut Butter',null,325,null,'500 g','{"category":"Peanut Butter","description":"Unsweetened peanut butter.","ingredients":["peanuts"],"facts":["Energy 585 kcal per 100 g","Protein 25 g per 100 g","Carbohydrate 16 g per 100 g","Dietary Fibre 8.5 g per 100 g","Total Sugars 4 g per 100 g","Total Fat 48 g per 100 g","Saturated Fat 7.5 g per 100 g","Trans Fat 0 g per 100 g","Sodium 5 mg per 100 g"],"usage":["breakfast","toast","snacking","smoothies"]}','["Unsweetened"]','["weight loss","muscle gain outcome","disease prevention","doctor recommended"]','active','10000000-0000-0000-0000-000000000001'),
('PF-PB-RC','00000000-0000-0000-0000-000000000001','PF','Ragi & Cocoa Peanut Butter with Jaggery',null,365,null,'500 g','{"category":"Peanut Butter","description":"Peanut butter with ragi, cocoa and jaggery.","ingredients":["peanuts","ragi","cocoa","jaggery"],"facts":["Energy 560 kcal per 100 g","Protein 22.5 g per 100 g","Carbohydrate 22 g per 100 g","Total Sugars 4 g per 100 g","Total Fat 42 g per 100 g","Saturated Fat 8 g per 100 g","Trans Fat 0 g per 100 g","Sodium 20 mg per 100 g","Calcium 120 mg per 100 g","Iron 4.5 mg per 100 g"],"usage":["breakfast","toast","snacking","smoothies"]}','[]','["weight loss","muscle gain outcome","disease prevention","doctor recommended"]','active','10000000-0000-0000-0000-000000000001'),
('PF-PORRIDGE-SB','00000000-0000-0000-0000-000000000001','PF','Sunrise Bowl — Sprouted Ragi & Sweet Potato Porridge Mix','SBPM-SP200',null,null,'200 g','{"category":"Porridge","description":"Sprouted ragi and sweet potato porridge mix.","ingredients":["sweet potato","almonds","oats","sprouted ragi"],"facts":["Type: Ragi","Age ideal: 6–24 months","Minimum age: 6+ months","Organic: Yes","Sugar Free","Gluten Free","No Added Preservatives","Vegetarian"],"usage":["breakfast","porridge"]}','["Sugar Free","Gluten Free","No Added Preservatives","Organic","Vegetarian"]','["child development outcomes","immunity claims","medical claims","doctor recommended"]','active','10000000-0000-0000-0000-000000000001'),
('PF-BAR-PURGRAIN','00000000-0000-0000-0000-000000000001','PF','Pur’Grain Bar',null,null,null,null,'{"category":"Health Bars","description":"Planned health-bar line. Product truth, variants, pack size, MRP and nutrition need completion before creative production.","ingredients":[],"facts":[],"usage":["snacking","office","travel"]}','[]','["nutrition claims until verified","protein claims until verified","health outcomes"]','planned','10000000-0000-0000-0000-000000000001'),
('PF-NUTREMIX-PURGRO','00000000-0000-0000-0000-000000000001','PF','Pur’Gro Nutremix',null,null,null,null,'{"category":"Functional Nutrition","description":"Complete product truth and commercial fields before activating.","ingredients":[],"facts":[],"usage":[]}','[]','["development claims until verified","immunity claims until verified","medical claims"]','draft','10000000-0000-0000-0000-000000000001'),
('PF-NUTREMIX-PURCHARGE','00000000-0000-0000-0000-000000000001','PF','Pur’Charge Nutremix',null,null,null,null,'{"category":"Functional Nutrition","description":"Complete product truth and commercial fields before activating.","ingredients":[],"facts":[],"usage":[]}','[]','["performance outcomes until verified","medical claims","energy claims until verified"]','draft','10000000-0000-0000-0000-000000000001'),
('PF-GREENX','00000000-0000-0000-0000-000000000001','PF','Pur’ GreenX',null,null,null,null,'{"category":"Functional Nutrition","description":"Ingredients, nutrition, claims, pack size and MRP need verification before activation.","ingredients":[],"facts":[],"usage":[]}','[]','["gut health outcomes until verified","immunity claims until verified","detox claims","medical claims"]','draft','10000000-0000-0000-0000-000000000001')
on conflict (id) do update set name=excluded.name,sku=coalesce(excluded.sku,public.products.sku),mrp=coalesce(excluded.mrp,public.products.mrp),pack_size=coalesce(excluded.pack_size,public.products.pack_size),product_truth=excluded.product_truth,claims_allowed=excluded.claims_allowed,claims_prohibited=excluded.claims_prohibited,status=excluded.status,updated_at=now();

commit;

-- Verification summary
select 'workspaces' as entity, count(*) as rows from public.workspaces
union all select 'brands', count(*) from public.brands
union all select 'products', count(*) from public.products
union all select 'audiences', count(*) from public.audiences
union all select 'briefs', count(*) from public.briefs
union all select 'production_jobs', count(*) from public.production_jobs;
