-- Creative OS V6 local PostgreSQL upgrade
-- Run once inside creative_os_db AFTER V5 local schema + seed.
-- Adds planned product status and expands the Pur’ Ferme product catalog.

begin;

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('draft','planned','active','inactive','archived'));

-- Pilot product: keep / refresh with current source-of-truth.
insert into public.products
(id,workspace_id,brand_id,name,sku,mrp,selling_price,pack_size,product_truth,claims_allowed,claims_prohibited,status,created_by)
values
(
 'PF-COOKIE-BRK','00000000-0000-0000-0000-000000000001','PF','Millet & Oats Breakfast Cookies','Cookies_Breakfast',339,null,'240 g',
 '{"category":"Cookies","description":"Clean-label millet and oats breakfast cookies positioned as an everyday better choice and coffee/tea companion.","ingredients":["foxtail millet","rolled oats","jaggery","almonds","cashews","cow butter"],"facts":["No maida","No refined sugar","No palm oil","No artificial preservatives"],"usage":["breakfast accompaniment","coffee","tea","office","mid-morning","evening","travel"]}',
 '["No maida","No refined sugar","No palm oil","No artificial preservatives","Millet + oats"]',
 '["meal replacement","weight loss","disease prevention","immunity","doctor recommended","gluten-free unless verified"]','active','10000000-0000-0000-0000-000000000001'
),
(
 'PF-COOKIE-CHO','00000000-0000-0000-0000-000000000001','PF','Millets & Oats Chocolate Cookies',null,349,null,'240 g',
 '{"category":"Cookies","description":"Chocolate variant of the millet-and-oats cookie range.","ingredients":[],"facts":["No maida","No refined sugar","No palm oil","No artificial preservatives","Made with foxtail millet","Made with oats","Real cocoa"],"usage":["coffee","tea","office","snacking","travel"]}',
 '["No maida","No refined sugar","No palm oil","No artificial preservatives","Millets + oats","Real cocoa"]',
 '["weight loss","disease prevention","immunity","doctor recommended","gluten-free unless verified"]','active','10000000-0000-0000-0000-000000000001'
),
(
 'PF-PB-PLAIN','00000000-0000-0000-0000-000000000001','PF','Unsweetened Peanut Butter',null,325,null,'500 g',
 '{"category":"Peanut Butter","description":"Unsweetened peanut butter.","ingredients":["peanuts"],"facts":["Energy 585 kcal per 100 g","Protein 25 g per 100 g","Carbohydrate 16 g per 100 g","Dietary Fibre 8.5 g per 100 g","Total Sugars 4 g per 100 g","Total Fat 48 g per 100 g","Saturated Fat 7.5 g per 100 g","Trans Fat 0 g per 100 g","Sodium 5 mg per 100 g"],"usage":["breakfast","toast","snacking","smoothies"]}',
 '["Unsweetened"]',
 '["weight loss","muscle gain outcome","disease prevention","doctor recommended"]','active','10000000-0000-0000-0000-000000000001'
),
(
 'PF-PB-RC','00000000-0000-0000-0000-000000000001','PF','Ragi & Cocoa Peanut Butter with Jaggery',null,365,null,'500 g',
 '{"category":"Peanut Butter","description":"Peanut butter with ragi, cocoa and jaggery.","ingredients":["peanuts","ragi","cocoa","jaggery"],"facts":["Energy 560 kcal per 100 g","Protein 22.5 g per 100 g","Carbohydrate 22 g per 100 g","Total Sugars 4 g per 100 g","Total Fat 42 g per 100 g","Saturated Fat 8 g per 100 g","Trans Fat 0 g per 100 g","Sodium 20 mg per 100 g","Calcium 120 mg per 100 g","Iron 4.5 mg per 100 g"],"usage":["breakfast","toast","snacking","smoothies"]}',
 '[]',
 '["weight loss","muscle gain outcome","disease prevention","doctor recommended"]','active','10000000-0000-0000-0000-000000000001'
),
(
 'PF-PORRIDGE-SB','00000000-0000-0000-0000-000000000001','PF','Sunrise Bowl — Sprouted Ragi & Sweet Potato Porridge Mix','SBPM-SP200',null,null,'200 g',
 '{"category":"Porridge","description":"Sprouted ragi and sweet potato porridge mix.","ingredients":["sweet potato","almonds","oats","sprouted ragi"],"facts":["Type: Ragi","Age ideal: 6–24 months","Minimum age: 6+ months","Organic: Yes","Sugar Free","Gluten Free","No Added Preservatives","Vegetarian"],"usage":["breakfast","porridge"]}',
 '["Sugar Free","Gluten Free","No Added Preservatives","Organic","Vegetarian"]',
 '["child development outcomes","immunity claims","medical claims","doctor recommended"]','active','10000000-0000-0000-0000-000000000001'
),
(
 'PF-BAR-PURGRAIN','00000000-0000-0000-0000-000000000001','PF','Pur’Grain Bar',null,null,null,null,
 '{"category":"Health Bars","description":"Planned health-bar line. Product truth, variants, pack size, MRP and nutrition need completion before creative production.","ingredients":[],"facts":[],"usage":["snacking","office","travel"]}',
 '[]','["nutrition claims until verified","protein claims until verified","health outcomes"]','planned','10000000-0000-0000-0000-000000000001'
),
(
 'PF-NUTREMIX-PURGRO','00000000-0000-0000-0000-000000000001','PF','Pur’Gro Nutremix',null,null,null,null,
 '{"category":"Functional Nutrition","description":"Pur’Gro product record created from the existing catalog context. Complete product truth and commercial fields before activating.","ingredients":[],"facts":[],"usage":[]}',
 '[]','["development claims until verified","immunity claims until verified","medical claims"]','draft','10000000-0000-0000-0000-000000000001'
),
(
 'PF-NUTREMIX-PURCHARGE','00000000-0000-0000-0000-000000000001','PF','Pur’Charge Nutremix',null,null,null,null,
 '{"category":"Functional Nutrition","description":"Pur’Charge product record created from the existing catalog context. Complete product truth and commercial fields before activating.","ingredients":[],"facts":[],"usage":[]}',
 '[]','["performance outcomes until verified","medical claims","energy claims until verified"]','draft','10000000-0000-0000-0000-000000000001'
),
(
 'PF-GREENX','00000000-0000-0000-0000-000000000001','PF','Pur’ GreenX',null,null,null,null,
 '{"category":"Functional Nutrition","description":"Pur’ GreenX record created from the existing product context. Ingredients, nutrition, claims, pack size and MRP need verification before activation.","ingredients":[],"facts":[],"usage":[]}',
 '[]','["gut health outcomes until verified","immunity claims until verified","detox claims","medical claims"]','draft','10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set
  workspace_id=excluded.workspace_id,
  brand_id=excluded.brand_id,
  name=excluded.name,
  sku=coalesce(excluded.sku,public.products.sku),
  mrp=coalesce(excluded.mrp,public.products.mrp),
  selling_price=coalesce(excluded.selling_price,public.products.selling_price),
  pack_size=coalesce(excluded.pack_size,public.products.pack_size),
  product_truth=excluded.product_truth,
  claims_allowed=excluded.claims_allowed,
  claims_prohibited=excluded.claims_prohibited,
  status=excluded.status,
  updated_at=now();

commit;

select id,name,status,sku,mrp,pack_size
from public.products
where brand_id='PF'
order by case status when 'active' then 1 when 'planned' then 2 else 3 end, name;
