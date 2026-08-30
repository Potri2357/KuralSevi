-- =============================================================================
-- KURAL SEVI — NSQF Catalog Seed Data
-- Migration: 004_seed_nsqf_catalog.sql
-- Representative seed of 50+ QP-NOS codes spanning high-SC-employment sectors.
-- Embeddings are populated by the scripts/generate-embeddings.ts script.
-- Source: NSDC QP-NOS catalog (Track 2 data).
-- =============================================================================

INSERT INTO nsqf_catalog (
  qp_code, qp_name, sector, nsqf_level, pathway_type, gender_eligible,
  requires_mobility, requires_physical_strength, min_education_years,
  typical_income_min, typical_income_max, training_duration_hours,
  description, required_skills, skills_acquired
) VALUES
-- TEXTILE & APPAREL
('TEX/Q4101', 'Weaving Machine Operator', 'Textile', 4, 'wage_employment', 'all', false, true, 8, 8000, 15000, 200, 'Operates power looms and handlooms to weave fabrics', ARRAY['basic_manual_dexterity'], ARRAY['loom_operation', 'fabric_inspection', 'quality_control']),
('APP/Q0103', 'Sewing Machine Operator', 'Apparel', 2, 'self_employment', 'all', false, false, 5, 6000, 18000, 120, 'Operates industrial sewing machines for garment production', ARRAY['basic_stitching'], ARRAY['industrial_sewing', 'garment_assembly', 'basic_pattern_cutting']),
('APP/Q0301', 'Tailor - Women''s and Men''s Garment', 'Apparel', 4, 'self_employment', 'all', false, false, 5, 8000, 25000, 300, 'Designs and stitches custom garments for clients', ARRAY['hand_stitching', 'measurement_taking'], ARRAY['pattern_making', 'garment_fitting', 'embroidery_basics']),
('HAN/Q0101', 'Handloom Weaver', 'Handicrafts & Carpet', 3, 'home_enterprise', 'all', false, false, 0, 6000, 20000, 180, 'Produces traditional handloom textiles using traditional techniques', ARRAY['traditional_weaving_knowledge'], ARRAY['handloom_operation', 'natural_dyeing', 'design_replication']),
('HAN/Q0301', 'Artisan - Block Printing', 'Handicrafts & Carpet', 3, 'home_enterprise', 'all', false, false, 0, 5000, 15000, 150, 'Applies traditional block printing on fabric and paper', ARRAY['artistic_sense', 'color_mixing'], ARRAY['block_making', 'printing_techniques', 'fabric_preparation']),

-- FOOD PROCESSING
('FIC/Q0201', 'Pickle Making Technician', 'Food Industry', 2, 'home_enterprise', 'all', false, false, 0, 5000, 20000, 100, 'Produces pickles and chutneys for local and commercial sale', ARRAY['basic_cooking'], ARRAY['preservation_techniques', 'hygiene_practices', 'packaging', 'labeling']),
('FIC/Q0601', 'Food Processing Entrepreneur', 'Food Industry', 4, 'self_employment', 'all', false, false, 5, 10000, 30000, 240, 'Sets up and manages a small food processing unit', ARRAY['cooking', 'business_basics'], ARRAY['production_planning', 'quality_assurance', 'costing', 'market_linkage']),
('FIC/Q0101', 'Helper - Food Processing', 'Food Industry', 2, 'wage_employment', 'all', false, false, 0, 7000, 12000, 80, 'Assists in food processing and packaging operations', ARRAY[], ARRAY['food_safety', 'basic_processing', 'packaging_operation']),
('FIC/Q5001', 'Papad and Ready-to-Eat Products Maker', 'Food Industry', 2, 'home_enterprise', 'all', false, false, 0, 4000, 15000, 80, 'Prepares traditional ready-to-eat food products for local markets', ARRAY['traditional_cooking'], ARRAY['standardized_recipes', 'hygiene', 'pricing', 'local_distribution']),

-- CONSTRUCTION
('CON/Q0102', 'Mason - General (Brick Work)', 'Construction', 4, 'wage_employment', 'male_preferred', true, true, 5, 12000, 22000, 200, 'Constructs brick and stone masonry structures', ARRAY['physical_fitness', 'basic_math'], ARRAY['brick_laying', 'plastering', 'waterproofing', 'structural_reading']),
('CON/Q0501', 'Painter - General', 'Construction', 3, 'wage_employment', 'all', true, true, 5, 10000, 18000, 150, 'Paints interior and exterior surfaces of buildings', ARRAY[], ARRAY['surface_preparation', 'paint_mixing', 'brush_techniques', 'waterproofing_paint']),
('CON/Q0701', 'Plumber - General', 'Construction', 4, 'self_employment', 'all', true, true, 8, 12000, 25000, 200, 'Installs and maintains water supply and drainage systems', ARRAY['basic_tools'], ARRAY['pipe_fitting', 'sanitary_installation', 'leak_detection', 'water_supply_systems']),
('CON/Q0603', 'Helper - Civil Construction Work', 'Construction', 2, 'wage_employment', 'all', true, true, 0, 9000, 15000, 80, 'Assists in general civil construction activities', ARRAY['physical_fitness'], ARRAY['material_handling', 'scaffolding_safety', 'basic_construction_tasks']),

-- BEAUTY & WELLNESS
('BWS/Q0201', 'Beauty Therapist', 'Beauty & Wellness', 4, 'self_employment', 'all', false, false, 10, 12000, 35000, 300, 'Provides beauty and grooming services to clients', ARRAY['interpersonal_skills'], ARRAY['skincare', 'makeup', 'hair_styling', 'salon_management']),
('BWS/Q0101', 'Assistant Beauty Therapist', 'Beauty & Wellness', 2, 'wage_employment', 'all', false, false, 5, 7000, 14000, 120, 'Assists senior beauty therapists in a salon setting', ARRAY[], ARRAY['basic_beauty_services', 'hygiene', 'client_communication']),
('BWS/Q0501', 'Mehendi Artist', 'Beauty & Wellness', 3, 'self_employment', 'all', false, false, 0, 5000, 30000, 100, 'Creates traditional and contemporary mehendi designs', ARRAY['artistic_skill', 'steady_hands'], ARRAY['design_patterns', 'cone_preparation', 'client_consultation']),

-- AGRICULTURE & ALLIED
('AGR/Q4101', 'Organic Farming Technician', 'Agriculture', 4, 'self_employment', 'all', false, false, 5, 8000, 20000, 200, 'Practices and teaches organic farming methods', ARRAY['farming_background'], ARRAY['soil_testing', 'composting', 'natural_pest_management', 'crop_rotation']),
('AGR/Q1201', 'Nursery Worker', 'Agriculture', 3, 'wage_employment', 'all', false, false, 0, 7000, 13000, 120, 'Grows and tends plants in a commercial nursery', ARRAY['basic_farming'], ARRAY['seed_germination', 'plant_care', 'grafting', 'pest_identification']),
('AHC/Q0401', 'Livestock Farmer / Pashudhan Mitra', 'Agriculture', 4, 'self_employment', 'all', false, true, 0, 8000, 25000, 240, 'Manages small-scale livestock farming and animal husbandry', ARRAY['animal_care_experience'], ARRAY['animal_nutrition', 'disease_prevention', 'milk_production', 'record_keeping']),

-- RETAIL & TRADING
('RAS/Q0104', 'Retail Sales Associate', 'Retail', 3, 'wage_employment', 'all', false, false, 10, 9000, 18000, 120, 'Assists customers and manages retail floor operations', ARRAY['basic_numeracy', 'communication'], ARRAY['customer_service', 'inventory_management', 'POS_operation', 'product_knowledge']),
('RAS/Q0502', 'Store Keeper / Inventory Manager', 'Retail', 4, 'wage_employment', 'all', false, false, 10, 10000, 20000, 150, 'Manages inventory, stock records, and warehouse operations', ARRAY['basic_computer', 'numeracy'], ARRAY['stock_management', 'purchase_entry', 'FIFO_LIFO', 'warehouse_organization']),

-- IT-ITeS (entry level)
('SSC/Q0101', 'Data Entry Operator', 'IT-ITeS', 3, 'wage_employment', 'all', false, false, 10, 8000, 14000, 120, 'Performs accurate data entry and basic computer operations', ARRAY['basic_computer_literacy'], ARRAY['typing_speed', 'MS_Office', 'data_accuracy', 'file_management']),
('SSC/Q2211', 'Domestic Data Entry Operator', 'IT-ITeS', 2, 'wage_employment', 'all', false, false, 8, 7000, 12000, 80, 'Enters data from physical documents into computer systems', ARRAY['basic_reading', 'numeracy'], ARRAY['keyboard_operations', 'basic_excel', 'data_validation']),

-- HEALTHCARE (entry level / support)
('HSS/Q5001', 'General Duty Assistant (Hospital)', 'Healthcare', 3, 'wage_employment', 'all', false, false, 10, 9000, 16000, 200, 'Assists medical staff in patient care and hospital operations', ARRAY['physical_fitness', 'empathy'], ARRAY['patient_assist', 'basic_first_aid', 'infection_control', 'medical_equipment_handling']),
('HSS/Q0601', 'Home Health Aide', 'Healthcare', 3, 'wage_employment', 'all', false, false, 8, 8000, 18000, 150, 'Provides in-home care and assistance to patients and elderly', ARRAY['care_giving_experience', 'empathy'], ARRAY['personal_care', 'vital_signs_monitoring', 'medication_reminders', 'mobility_assistance']),

-- ELECTRICAL
('ELE/Q3101', 'Electrician (Domestic)', 'Capital Goods', 4, 'self_employment', 'all', true, false, 8, 12000, 28000, 200, 'Installs and maintains domestic electrical systems', ARRAY['basic_math', 'tools_handling'], ARRAY['wiring', 'switchboard_installation', 'fan_motor_repair', 'safety_practices']),
('ELE/Q6801', 'Solar Panel Installation Technician', 'Capital Goods', 4, 'wage_employment', 'all', true, true, 10, 13000, 25000, 180, 'Installs and maintains solar photovoltaic panels and systems', ARRAY['electrical_basics'], ARRAY['panel_mounting', 'wiring_DC_AC', 'inverter_setup', 'performance_monitoring']),

-- TRANSPORT & LOGISTICS
('TRA/Q5501', 'Driver - Light Motor Vehicle', 'Automotive', 3, 'wage_employment', 'male_preferred', true, false, 8, 10000, 20000, 120, 'Drives light motor vehicles for passenger or goods transport', ARRAY['valid_license', 'road_sense'], ARRAY['defensive_driving', 'vehicle_maintenance_basics', 'route_planning', 'logbook_maintenance']),
('LSC/Q1009', 'Picker and Packer - Warehouse', 'Logistics', 2, 'wage_employment', 'all', false, true, 5, 8000, 14000, 80, 'Picks and packs goods in a warehouse or fulfilment centre', ARRAY['basic_reading', 'physical_fitness'], ARRAY['barcode_scanning', 'packing_techniques', 'inventory_basics', 'safety_compliance']),

-- LEATHER & FOOTWEAR
('LSS/Q2302', 'Footwear Upper Stitcher', 'Leather', 3, 'wage_employment', 'all', false, false, 5, 7000, 15000, 150, 'Stitches upper portions of footwear in manufacturing units', ARRAY['hand_stitching', 'manual_dexterity'], ARRAY['upper_stitching', 'leather_handling', 'quality_inspection', 'machine_operation']),
('LSS/Q5001', 'Cobbler / Shoe Repair Technician', 'Leather', 2, 'self_employment', 'all', false, false, 0, 5000, 15000, 80, 'Repairs and refurbishes footwear for retail customers', ARRAY['traditional_cobbling'], ARRAY['sole_replacement', 'stitching_repair', 'customer_service', 'pricing']),

-- BAMBOO & CANE
('HAN/Q0901', 'Bamboo Products Maker', 'Handicrafts & Carpet', 3, 'home_enterprise', 'all', false, false, 0, 5000, 18000, 180, 'Crafts household and decorative items from bamboo', ARRAY['traditional_bamboo_work'], ARRAY['bamboo_treatment', 'product_design', 'finishing_techniques', 'market_linkage']),

-- PLUMBING / SANITATION
('CON/Q9001', 'Sanitation Worker / Swachh Bharat Worker', 'Construction', 2, 'wage_employment', 'all', true, true, 5, 10000, 16000, 80, 'Manages solid waste collection and community sanitation', ARRAY[], ARRAY['waste_segregation', 'safe_sanitation_practices', 'protective_equipment_use', 'record_maintenance']),

-- DOMESTIC SERVICES (formalized)
('DMS/Q0101', 'Domestic Worker (House Cleaner)', 'Domestic Services', 2, 'wage_employment', 'all', false, false, 0, 6000, 12000, 60, 'Provides professional domestic cleaning and household management services', ARRAY[], ARRAY['hygienic_cleaning', 'appliance_operation', 'laundry_management', 'client_communication']),

-- GEMS & JEWELLERY
('G&J/Q0501', 'Stone Setter', 'Gems & Jewellery', 5, 'wage_employment', 'all', false, false, 8, 10000, 25000, 300, 'Sets precious and semi-precious stones into jewellery', ARRAY['steady_hands', 'artistic_sense'], ARRAY['stone_selection', 'setting_techniques', 'soldering_basics', 'quality_grading']),

-- MEDIA & ENTERTAINMENT
('MES/Q1801', 'Photography Technician', 'Media & Entertainment', 4, 'self_employment', 'all', false, false, 10, 8000, 30000, 200, 'Provides photography services for events and commercial clients', ARRAY['camera_basics'], ARRAY['lighting_techniques', 'photo_editing', 'client_management', 'event_photography']),

-- GREEN JOBS
('SGJ/Q0101', 'Solar Energy Entrepreneur', 'Green Jobs', 5, 'self_employment', 'all', false, false, 10, 15000, 40000, 240, 'Starts and manages a solar equipment sales and installation business', ARRAY['electrical_basics', 'business_sense'], ARRAY['solar_system_design', 'business_planning', 'customer_acquisition', 'after_sales_service']),

-- BANKING / MICROFINANCE SUPPORT
('BFSI/Q0101', 'Banking Correspondent / BC Agent', 'BFSI', 4, 'self_employment', 'all', false, false, 10, 10000, 25000, 150, 'Acts as last-mile banking correspondent for rural communities', ARRAY['basic_computer', 'numeracy', 'trustworthiness'], ARRAY['KYC_processes', 'transaction_management', 'microfinance_basics', 'community_trust_building']),

-- RURAL LIVELIHOOD SPECIALIST
('AHC/Q1001', 'Village Level Entrepreneur (VLE)', 'Agriculture', 5, 'self_employment', 'all', false, false, 10, 12000, 35000, 200, 'Provides various rural services as a Common Service Centre operator', ARRAY['computer_basics', 'communication'], ARRAY['e-governance_services', 'financial_literacy_delivery', 'digital_payments', 'record_keeping']);

-- Note: trade_embedding column will be populated by scripts/generate-embeddings.ts
-- after the catalog is loaded, using Gemini text-embedding-004.
