-- Обновить calculation_data для демо-студии реалистичными услугами
DO $$
DECLARE
  v_sid uuid := '621b0ab8-4d00-4f5e-a45f-4b95177e9449';
  v_rec record;
  v_price numeric;
  v_tpl int;
  v_data jsonb;
BEGIN
  FOR v_rec IN
    SELECT id, total_price FROM calculations WHERE studio_id = v_sid
  LOOP
    v_price := coalesce(v_rec.total_price, 50000);
    v_tpl := 1 + floor(random() * 8);

    v_data := CASE v_tpl
    WHEN 1 THEN -- Полная оклейка
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object(
          'wrapMat', round(v_price * 0.25)::text || '.00',
          'wrapMot', round(v_price * 0.35)::text || '.00',
          'prepMat', round(v_price * 0.05)::text || '.00',
          'prepMot', round(v_price * 0.10)::text || '.00',
          'armMat', round(v_price * 0.03)::text || '.00',
          'armMot', round(v_price * 0.12)::text || '.00',
          'markup', '40', 'costs', '[]'::jsonb
        ),
        'impact', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'markups', '{"gl":"40","arm":"40","det":"40","misc":"40","wrap":"40"}'::jsonb,
        'discount', '0',
        'paymentMode', 'cash',
        'services_detail', jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'det','[]'::jsonb,'wrap','[]'::jsonb)
      )
    WHEN 2 THEN -- Оклейка ударной части
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'impact', jsonb_build_object(
          'wrapMat', round(v_price * 0.30)::text || '.00',
          'wrapMot', round(v_price * 0.40)::text || '.00',
          'prepMat', round(v_price * 0.05)::text || '.00',
          'prepMot', round(v_price * 0.10)::text || '.00',
          'armMat', '', 'armMot', '', 'markup', '40', 'costs', '[]'::jsonb
        ),
        'markups', '{"gl":"40","arm":"40","det":"40","misc":"40","wrap":"40"}'::jsonb,
        'discount', '0',
        'paymentMode', 'cash',
        'services_detail', jsonb_build_object('gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'det','[]'::jsonb,'wrap','[]'::jsonb)
      )
    WHEN 3 THEN -- Детейлинг: полировка + химчистка
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'impact', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'markups', '{"gl":"40","arm":"40","det":"50","misc":"40","wrap":"40"}'::jsonb,
        'discount', '0',
        'paymentMode', 'cash',
        'services_detail', jsonb_build_object(
          'gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
          'det', jsonb_build_array(
            jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.15),'mot',round(v_price*0.45)),
            jsonb_build_object('name','Химчистка салона','mat',round(v_price*0.10),'mot',round(v_price*0.30))
          )
        )
      )
    WHEN 4 THEN -- Керамика + полировка
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'impact', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'markups', '{"gl":"40","arm":"40","det":"50","misc":"40","wrap":"40"}'::jsonb,
        'discount', '5',
        'paymentMode', 'card',
        'services_detail', jsonb_build_object(
          'gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
          'det', jsonb_build_array(
            jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.10),'mot',round(v_price*0.30)),
            jsonb_build_object('name','Нанесение керамики','mat',round(v_price*0.25),'mot',round(v_price*0.35))
          )
        )
      )
    WHEN 5 THEN -- Тонировка + бронирование стёкол
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'impact', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'markups', '{"gl":"40","arm":"40","det":"40","misc":"40","wrap":"40"}'::jsonb,
        'discount', '0',
        'paymentMode', 'cash',
        'services_detail', jsonb_build_object(
          'det','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
          'gl', jsonb_build_array(
            jsonb_build_object('name','Тонировка задних стёкол','mat',round(v_price*0.20),'mot',round(v_price*0.30)),
            jsonb_build_object('name','Бронирование лобового','mat',round(v_price*0.25),'mot',round(v_price*0.25))
          )
        )
      )
    WHEN 6 THEN -- Полная оклейка + детейлинг
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object(
          'wrapMat', round(v_price * 0.18)::text || '.00',
          'wrapMot', round(v_price * 0.25)::text || '.00',
          'prepMat', round(v_price * 0.04)::text || '.00',
          'prepMot', round(v_price * 0.08)::text || '.00',
          'armMat', round(v_price * 0.02)::text || '.00',
          'armMot', round(v_price * 0.08)::text || '.00',
          'markup', '40', 'costs', '[]'::jsonb
        ),
        'impact', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'markups', '{"gl":"40","arm":"40","det":"50","misc":"40","wrap":"40"}'::jsonb,
        'discount', '3',
        'paymentMode', 'mixed',
        'services_detail', jsonb_build_object(
          'gl','[]'::jsonb,'ms','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
          'det', jsonb_build_array(
            jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.08),'mot',round(v_price*0.15)),
            jsonb_build_object('name','Химчистка салона','mat',round(v_price*0.04),'mot',round(v_price*0.08))
          )
        )
      )
    WHEN 7 THEN -- Бронирование фар + плёнка на пороги
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'impact', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'markups', '{"gl":"40","arm":"40","det":"40","misc":"40","wrap":"40"}'::jsonb,
        'discount', '0',
        'paymentMode', 'cash',
        'services_detail', jsonb_build_object(
          'gl','[]'::jsonb,'det','[]'::jsonb,'ms','[]'::jsonb,
          'arm', jsonb_build_array(
            jsonb_build_object('name','Бронирование фар','mat',round(v_price*0.20),'mot',round(v_price*0.25)),
            jsonb_build_object('name','Бронирование порогов','mat',round(v_price*0.15),'mot',round(v_price*0.20))
          ),
          'wrap', jsonb_build_array(
            jsonb_build_object('name','Оклейка зеркал','mat',round(v_price*0.05),'mot',round(v_price*0.15))
          )
        )
      )
    ELSE -- Комплекс: ударная + детейлинг + доп услуги
      jsonb_build_object(
        'car', (SELECT calculation_data->'car' FROM calculations WHERE id = v_rec.id),
        'package', jsonb_build_object('wrapMat','','wrapMot','','prepMat','','prepMot','','armMat','','armMot','','markup','40','costs','[]'::jsonb),
        'impact', jsonb_build_object(
          'wrapMat', round(v_price * 0.15)::text || '.00',
          'wrapMot', round(v_price * 0.20)::text || '.00',
          'prepMat', round(v_price * 0.03)::text || '.00',
          'prepMot', round(v_price * 0.05)::text || '.00',
          'armMat', '', 'armMot', '', 'markup', '40', 'costs', '[]'::jsonb
        ),
        'markups', '{"gl":"40","arm":"40","det":"50","misc":"40","wrap":"40"}'::jsonb,
        'discount', '0',
        'paymentMode', 'cash',
        'services_detail', jsonb_build_object(
          'gl','[]'::jsonb,'arm','[]'::jsonb,'wrap','[]'::jsonb,
          'det', jsonb_build_array(
            jsonb_build_object('name','Полировка кузова','mat',round(v_price*0.08),'mot',round(v_price*0.12))
          ),
          'ms', jsonb_build_array(
            jsonb_build_object('name','Антидождь на стёкла','mat',round(v_price*0.05),'mot',round(v_price*0.07)),
            jsonb_build_object('name','Чернение резины','mat',round(v_price*0.03),'mot',round(v_price*0.05))
          )
        )
      )
    END;

    UPDATE calculations SET calculation_data = v_data WHERE id = v_rec.id;
  END LOOP;

  RAISE NOTICE 'Updated calculation_data for all demo cards';
END $$;

-- Verify
SELECT id, car_name, total_price, length(calculation_data::text) as data_len
FROM calculations
WHERE studio_id = '621b0ab8-4d00-4f5e-a45f-4b95177e9449'
ORDER BY random() LIMIT 5;
