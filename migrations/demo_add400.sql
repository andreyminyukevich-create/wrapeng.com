-- Добавить ещё 400 карточек в демо-студию
CREATE OR REPLACE FUNCTION _demo_car(OUT brand text, OUT model text) AS $$
DECLARE
  cars text[] := ARRAY[
    'BMW X5','BMW X3','BMW 3 Series','BMW 5 Series','BMW X6','BMW 7 Series','BMW M4',
    'Mercedes-Benz GLE','Mercedes-Benz GLC','Mercedes-Benz E-Class','Mercedes-Benz S-Class','Mercedes-Benz C-Class','Mercedes-Benz CLA',
    'Audi Q7','Audi Q5','Audi A6','Audi A4','Audi Q3','Audi e-tron','Audi RS6',
    'Porsche Cayenne','Porsche Macan','Porsche Panamera','Porsche 911','Porsche Taycan',
    'Toyota Camry','Toyota RAV4','Toyota Land Cruiser','Toyota Corolla','Toyota Highlander',
    'Lexus RX','Lexus NX','Lexus LX','Lexus ES','Lexus GX',
    'Kia Sportage','Kia K5','Kia Sorento','Kia Ceed','Kia Stinger',
    'Hyundai Tucson','Hyundai Santa Fe','Hyundai Sonata','Hyundai Palisade','Hyundai Creta',
    'Volkswagen Tiguan','Volkswagen Touareg','Volkswagen Polo','Volkswagen Passat',
    'Skoda Kodiaq','Skoda Octavia','Skoda Superb','Skoda Karoq',
    'Mazda CX-5','Mazda CX-9','Mazda 6','Mazda 3',
    'Nissan X-Trail','Nissan Qashqai','Nissan Murano','Nissan Pathfinder',
    'Volvo XC90','Volvo XC60','Volvo S90','Volvo XC40',
    'Land Rover Range Rover','Land Rover Defender','Land Rover Discovery','Land Rover Velar',
    'Genesis G80','Genesis GV70','Genesis GV80','Genesis G90',
    'Chery Tiggo 7 Pro','Chery Tiggo 8 Pro','Chery Arrizo 8',
    'Haval Jolion','Haval F7','Haval Dargo','Haval H9',
    'Geely Monjaro','Geely Coolray','Geely Atlas Pro','Geely Tugella',
    'Lada Vesta','Lada Granta','Lada Niva Travel','Honda CR-V','Honda Civic'
  ];
  pick text; sp int;
BEGIN
  pick := cars[1 + floor(random() * array_length(cars, 1))];
  IF pick LIKE 'Land Rover%' THEN brand := 'Land Rover'; model := substring(pick from 12);
  ELSIF pick LIKE 'Mercedes-Benz%' THEN brand := 'Mercedes-Benz'; model := substring(pick from 15);
  ELSE sp := position(' ' in pick); brand := substring(pick from 1 for sp-1); model := substring(pick from sp+1);
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  v_sid  uuid := '621b0ab8-4d00-4f5e-a45f-4b95177e9449';
  v_uid  uuid := 'a881b1ca-7fe2-4eef-9c80-0da544ebe0b5';
  v_cid  uuid;
  v_brand text; v_model text; v_car text;
  v_client text; v_phone text;
  v_price numeric; v_final numeric;
  v_status text; v_created timestamptz; v_checkin date;
  v_mileage int; v_rnd float; v_i int;
  v_tpl int; v_data jsonb; v_car_json jsonb;

  v_first text[] := ARRAY['Александр','Дмитрий','Максим','Артём','Иван','Михаил','Андрей','Сергей','Николай','Павел','Евгений','Владимир','Олег','Кирилл','Роман','Алексей','Виктор','Денис','Станислав','Тимур'];
  v_last  text[] := ARRAY['Иванов','Петров','Сидоров','Козлов','Новиков','Морозов','Волков','Соколов','Кузнецов','Попов','Лебедев','Фёдоров','Егоров','Тихонов','Макаров','Орлов','Белов','Захаров','Григорьев','Романов'];
  v_fuels text[] := ARRAY['full','3/4','1/2','1/4','empty'];
  v_services text[] := ARRAY['Полная оклейка кузова','Оклейка ударной части','Бронирование лобового','Детейлинг','Тонировка','Полировка','Керамика','Химчистка салона','Бронирование фар','Оклейка крыши'];
  v_notes text[] := ARRAY['Клиент просил утром','Привезут на эвакуаторе','Второй визит','VIP клиент','Страховой случай','Комплекс услуг','Подготовка к продаже','Подарок жене','После ДТП','Корпоративный клиент'];
  v_damages text[] := ARRAY['Царапина на переднем бампере','Скол на лобовом','Вмятина на двери','Потёртости на порогах','Сколы на капоте','Без повреждений'];
  v_contractors text[] := ARRAY['ПДР Мастер','АвтоСтекло Про','Кузовной цех №1','Покраска Люкс','Шиномонтаж Профи'];
  v_works text[] := ARRAY['PDR','Замена стекла','Покраска','Кузовной ремонт','Полировка'];
  v_cancel text[] := ARRAY['Клиент передумал','Нашёл дешевле','Не приехал','Перенос на другую дату','Отказ от услуги'];

  v_exec_ids uuid[];
  v_exec_names text[];
  v_eidx int;
  v_days_ago int;
  v_empty_pkg jsonb := jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb);
  v_markups jsonb := '{"gl":"40","arm":"40","det":"50","misc":"40","wrap":"40"}'::jsonb;
BEGIN
  SELECT array_agg(id), array_agg(full_name) INTO v_exec_ids, v_exec_names
  FROM executors WHERE studio_id = v_sid AND is_active = true;

  FOR v_i IN 1..400 LOOP
    SELECT * FROM _demo_car() INTO v_brand, v_model;
    v_car := v_brand || ' ' || v_model;
    v_client := v_first[1+floor(random()*20)] || ' ' || v_last[1+floor(random()*20)];
    v_phone := '+7 9' || lpad(floor(random()*100)::text,2,'0') || ' ' || lpad(floor(random()*1000)::text,3,'0') || '-' || lpad(floor(random()*100)::text,2,'0') || '-' || lpad(floor(random()*100)::text,2,'0');

    -- Случайная дата за 13 месяцев
    v_days_ago := floor(random() * 390);
    v_created := '2025-03-01'::date + v_days_ago * interval '1 day' + (8+floor(random()*10)) * interval '1 hour' + floor(random()*60) * interval '1 minute';

    v_price := round((15000 + floor(random()*335000))::numeric / 1000) * 1000;
    v_mileage := 5000 + floor(random()*195000);
    v_rnd := random();

    -- Статус по давности (v_days_ago: 0=старые, 390=новые)
    IF v_days_ago < 300 THEN
      v_status := CASE WHEN v_rnd<0.70 THEN 'delivered' WHEN v_rnd<0.85 THEN 'closed' WHEN v_rnd<0.92 THEN 'cancelled' ELSE 'done' END;
    ELSIF v_days_ago < 370 THEN
      v_status := CASE WHEN v_rnd<0.30 THEN 'delivered' WHEN v_rnd<0.45 THEN 'done' WHEN v_rnd<0.60 THEN 'in_progress' WHEN v_rnd<0.70 THEN 'accepted' WHEN v_rnd<0.78 THEN 'outsourced' WHEN v_rnd<0.85 THEN 'scheduled' WHEN v_rnd<0.92 THEN 'closed' ELSE 'cancelled' END;
    ELSE
      v_status := CASE WHEN v_rnd<0.05 THEN 'delivered' WHEN v_rnd<0.15 THEN 'done' WHEN v_rnd<0.35 THEN 'in_progress' WHEN v_rnd<0.50 THEN 'accepted' WHEN v_rnd<0.60 THEN 'outsourced' WHEN v_rnd<0.80 THEN 'scheduled' ELSE 'cancelled' END;
    END IF;

    v_final := CASE WHEN v_status IN ('delivered','closed') THEN v_price + round(((random()*10000-5000)/1000)::numeric)*1000 ELSE NULL END;
    IF v_final IS NOT NULL AND v_final < v_price*0.8 THEN v_final := v_price; END IF;
    v_checkin := CASE WHEN v_status NOT IN ('cancelled') THEN (v_created + interval '1 day' + floor(random()*3)*interval '1 day')::date ELSE NULL END;

    -- calculation_data с услугами
    v_car_json := jsonb_build_object('brand', v_brand, 'model', v_model, 'year', (2020 + floor(random()*7))::text);
    v_tpl := 1 + floor(random() * 8);
    v_data := CASE v_tpl
    WHEN 1 THEN jsonb_build_object('car',v_car_json,
      'package',jsonb_build_object('wrapMat',round(v_price*0.25)::text||'.00','wrapMot',round(v_price*0.35)::text||'.00','prepMat',round(v_price*0.05)::text||'.00','prepMot',round(v_price*0.10)::text||'.00','armMat',round(v_price*0.03)::text||'.00','armMot',round(v_price*0.12)::text||'.00','markup','40','costs','[]'::jsonb),
      'impact',v_empty_pkg,'markups',v_markups,'discount','0','paymentMode','cash',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'det','[]'::jsonb,'wrap','[]'::jsonb))
    WHEN 2 THEN jsonb_build_object('car',v_car_json,
      'package',v_empty_pkg,
      'impact',jsonb_build_object('wrapMat',round(v_price*0.30)::text||'.00','wrapMot',round(v_price*0.40)::text||'.00','prepMat',round(v_price*0.05)::text||'.00','prepMot',round(v_price*0.10)::text||'.00','armMat','','armMot','','markup','40','costs','[]'::jsonb),
      'markups',v_markups,'discount','0','paymentMode','cash',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'det','[]'::jsonb,'wrap','[]'::jsonb))
    WHEN 3 THEN jsonb_build_object('car',v_car_json,'package',v_empty_pkg,'impact',v_empty_pkg,'markups',v_markups,'discount','0','paymentMode','cash',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
        'det',jsonb_build_array(jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.15),'mot',round(v_price*0.45)),jsonb_build_object('name','Химчистка салона','mat',round(v_price*0.10),'mot',round(v_price*0.30)))))
    WHEN 4 THEN jsonb_build_object('car',v_car_json,'package',v_empty_pkg,'impact',v_empty_pkg,'markups',v_markups,'discount','5','paymentMode','card',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
        'det',jsonb_build_array(jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.10),'mot',round(v_price*0.30)),jsonb_build_object('name','Нанесение керамики','mat',round(v_price*0.25),'mot',round(v_price*0.35)))))
    WHEN 5 THEN jsonb_build_object('car',v_car_json,'package',v_empty_pkg,'impact',v_empty_pkg,'markups',v_markups,'discount','0','paymentMode','cash',
      'services_detail',jsonb_build_object('det','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
        'gl',jsonb_build_array(jsonb_build_object('name','Тонировка задних стёкол','mat',round(v_price*0.20),'mot',round(v_price*0.30)),jsonb_build_object('name','Бронирование лобового','mat',round(v_price*0.25),'mot',round(v_price*0.25)))))
    WHEN 6 THEN jsonb_build_object('car',v_car_json,
      'package',jsonb_build_object('wrapMat',round(v_price*0.18)::text||'.00','wrapMot',round(v_price*0.25)::text||'.00','prepMat',round(v_price*0.04)::text||'.00','prepMot',round(v_price*0.08)::text||'.00','armMat',round(v_price*0.02)::text||'.00','armMot',round(v_price*0.08)::text||'.00','markup','40','costs','[]'::jsonb),
      'impact',v_empty_pkg,'markups',v_markups,'discount','3','paymentMode','mixed',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
        'det',jsonb_build_array(jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.08),'mot',round(v_price*0.15)),jsonb_build_object('name','Химчистка салона','mat',round(v_price*0.04),'mot',round(v_price*0.08)))))
    WHEN 7 THEN jsonb_build_object('car',v_car_json,'package',v_empty_pkg,'impact',v_empty_pkg,'markups',v_markups,'discount','0','paymentMode','cash',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'det','[]'::jsonb,'ms','[]'::jsonb,
        'arm',jsonb_build_array(jsonb_build_object('name','Бронирование фар','mat',round(v_price*0.20),'mot',round(v_price*0.25)),jsonb_build_object('name','Бронирование порогов','mat',round(v_price*0.15),'mot',round(v_price*0.20))),
        'wrap',jsonb_build_array(jsonb_build_object('name','Оклейка зеркал','mat',round(v_price*0.05),'mot',round(v_price*0.15)))))
    ELSE jsonb_build_object('car',v_car_json,'package',v_empty_pkg,
      'impact',jsonb_build_object('wrapMat',round(v_price*0.15)::text||'.00','wrapMot',round(v_price*0.20)::text||'.00','prepMat',round(v_price*0.03)::text||'.00','prepMot',round(v_price*0.05)::text||'.00','armMat','','armMot','','markup','40','costs','[]'::jsonb),
      'markups',v_markups,'discount','0','paymentMode','cash',
      'services_detail',jsonb_build_object('gl','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
        'det',jsonb_build_array(jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.08),'mot',round(v_price*0.12))),
        'ms',jsonb_build_array(jsonb_build_object('name','Антидождь на стёкла','mat',round(v_price*0.05),'mot',round(v_price*0.07)),jsonb_build_object('name','Чернение резины','mat',round(v_price*0.03),'mot',round(v_price*0.05)))))
    END;

    INSERT INTO calculations (user_id, studio_id, car_name, brand, model, car_brand, car_model,
      total_price, final_price, status, checkin_date, checkin_time, calculation_data,
      created_at, updated_at, schedule_note)
    VALUES (v_uid, v_sid, v_car, v_brand, v_model, v_brand, v_model,
      v_price, v_final, v_status, v_checkin,
      make_time(8+floor(random()*10)::int, (floor(random()*4)*15)::int, 0),
      v_data, v_created, v_created + interval '2 hours',
      CASE WHEN random()<0.3 THEN v_notes[1+floor(random()*10)] ELSE NULL END)
    RETURNING id INTO v_cid;

    -- Status history + sub-records
    INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
    VALUES (v_cid, v_sid, NULL, 'scheduled', v_uid, v_created);

    IF v_status IN ('accepted','in_progress','outsourced','done','delivered','closed') THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
      VALUES (v_cid, v_sid, 'scheduled', 'accepted', v_uid, v_created + interval '30 minutes');
      INSERT INTO acceptance_acts (calc_id, studio_id, mileage, fuel_level, damages, equipment, photo_checks, client_agreed, created_at)
      VALUES (v_cid, v_sid, v_mileage, v_fuels[1+floor(random()*5)],
        CASE WHEN random()<0.4 THEN v_damages[1+floor(random()*6)] ELSE NULL END,
        '{"запаска":true,"домкрат":true,"аптечка":true,"огнетушитель":false,"документы":true,"ключи":true}'::jsonb,
        '{"перед":true,"зад":true,"лев":true,"прав":true,"салон":false,"багаж":false}'::jsonb,
        true, v_created + interval '30 minutes');
    END IF;

    IF v_status IN ('in_progress','outsourced','done','delivered','closed') THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
      VALUES (v_cid, v_sid, 'accepted', 'in_progress', v_uid, v_created + interval '2 hours');
      v_eidx := 1 + floor(random() * array_length(v_exec_ids, 1));
      INSERT INTO work_assignments (studio_id, calculation_id, car_name, service_name, executor_id, executor_name, salary, status, created_at)
      VALUES (v_sid, v_cid, v_car, v_services[1+floor(random()*10)], v_exec_ids[v_eidx], v_exec_names[v_eidx],
        round((v_price*(0.15+random()*0.15))::numeric, -2),
        CASE WHEN v_status IN ('delivered','closed') THEN 'paid' ELSE 'pending' END,
        v_created + interval '2 hours');
      IF random() < 0.35 THEN
        v_eidx := 1 + floor(random() * array_length(v_exec_ids, 1));
        INSERT INTO work_assignments (studio_id, calculation_id, car_name, service_name, executor_id, executor_name, salary, status, created_at)
        VALUES (v_sid, v_cid, v_car, v_services[1+floor(random()*10)], v_exec_ids[v_eidx], v_exec_names[v_eidx],
          round((v_price*(0.08+random()*0.10))::numeric, -2),
          CASE WHEN v_status IN ('delivered','closed') THEN 'paid' ELSE 'pending' END,
          v_created + interval '3 hours');
      END IF;
    END IF;

    IF v_status = 'outsourced' THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
      VALUES (v_cid, v_sid, 'in_progress', 'outsourced', v_uid, v_created + interval '1 day');
      INSERT INTO outsource_records (calc_id, studio_id, contractor_name, work_type, deadline, outsource_type, created_at)
      VALUES (v_cid, v_sid, v_contractors[1+floor(random()*5)], v_works[1+floor(random()*5)],
        (v_created + interval '5 days')::date,
        CASE WHEN random()<0.6 THEN 'car_leaves' ELSE 'contractor_arrives' END,
        v_created + interval '1 day');
    END IF;

    IF v_status IN ('done','delivered','closed') THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
      VALUES (v_cid, v_sid, 'in_progress', 'done', v_uid, v_created + interval '2 days');
    END IF;

    IF v_status IN ('delivered','closed') THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
      VALUES (v_cid, v_sid, 'done', 'delivered', v_uid, v_created + interval '3 days');
      INSERT INTO delivery_acts (calc_id, studio_id, payment_method, payment_breakdown, total_amount, delivered_by, created_at)
      VALUES (v_cid, v_sid, (ARRAY['cash','card','transfer','mixed'])[1+floor(random()*4)],
        jsonb_build_object('cash', round((coalesce(v_final,v_price)*(0.3+random()*0.7))::numeric, -2)),
        coalesce(v_final,v_price),
        v_exec_names[1+floor(random()*array_length(v_exec_names,1))],
        v_created + interval '3 days');
    END IF;

    IF v_status = 'closed' THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, created_at)
      VALUES (v_cid, v_sid, 'delivered', 'closed', v_uid, v_created + interval '5 days');
    END IF;

    IF v_status = 'cancelled' THEN
      INSERT INTO status_history (calc_id, studio_id, from_status, to_status, changed_by, comment, created_at)
      VALUES (v_cid, v_sid, 'scheduled', 'cancelled', v_uid, v_cancel[1+floor(random()*5)], v_created + interval '1 day');
    END IF;

  END LOOP;

  RAISE NOTICE 'Добавлено 400 карточек';
END $$;

DROP FUNCTION IF EXISTS _demo_car();

SELECT status, count(*) FROM calculations
WHERE studio_id = '621b0ab8-4d00-4f5e-a45f-4b95177e9449'
GROUP BY status ORDER BY count(*) DESC;
