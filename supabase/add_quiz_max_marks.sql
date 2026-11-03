begin;

alter table public.quizzes
  add column if not exists max_marks numeric;

alter table public.quizzes
  add column if not exists quiz_url text;

update public.quizzes as quiz
set max_marks = scores.max_score
from (
  select quiz_id, max(score) as max_score
  from public.submissions
  where score is not null
  group by quiz_id
) as scores
where quiz.id::text = scores.quiz_id::text
  and quiz.max_marks is null;

with source_quizzes (spreadsheet_id, quiz_url, max_marks) as (
  values
    ('1etmWYcf9ebACwMKjmNojTRoX24q8wBb5rCkWNfW-qPw', 'https://forms.gle/3GTuLBbNGH8hzf3f8', 8),
    ('13aR1EktephsOPSqWCD9ySU22WhCXgoC_VNcwk18og6o', 'https://forms.gle/wH7Sne6kvmAyLfkA8', 8),
    ('16jp7nvLwv62aDipn3J_81KghK4VL4-pmY4UmCO7Eg0A', 'https://forms.gle/5uwnrCGGqBXdMXyp6', 8),
    ('1n0gH-f52EZtn7CgXwjLgQWx3LoyEH5ldVd0vMmh4bhg', 'https://forms.gle/8Xmbv1ATRvJSPRps8', 6),
    ('1cDujuedHKXITaB9Os-4ZWP8UzV4i2y-oRv4RpyeHlFM', 'https://forms.gle/y8h8wMS8YV7YCgQ97', 6),
    ('1shlQf-6z8DRVLo3yVA5e7CbURVxpaa0D16Z8Xc-p-kQ', 'https://forms.gle/pCReu1LNEybmigsM7', 10),
    ('1YFGtJsLMXw4cDMCiMFQuBcQFfCqC2R3lTUPz47785jc', 'https://forms.gle/X2sAzrKC4CCAKmLA6', 5),
    ('1p6JVUmyaGjRqMsRLQzjpMxDo4OjYmK8NcuhK5ruQZd0', 'https://forms.gle/Dh5XTYYHDyuoLp5DA', 9),
    ('17k4_eAlqDd7ddqYckykZKS5wBdVFJLInbFr-rMHBcrg', 'https://forms.gle/vcPnx7XMYNcrw1Sm8', 7),
    ('1jfPKp-8GcwkTBwZ71kYWjhOboZ0B34MRpQcPqXhVjdM', 'https://forms.gle/X7KtvoDrgQoxjBq26', 10),
    ('1CfG51itZJHNAqN4bYqBW3HJQGJBsDgX5NSqwlT5E3jc', 'https://forms.gle/5AgGd9dRVaJNXgTW8', 7),
    ('14WZZcBuHvg6jYXDKMyjL1T9057LydDGufL4i4r91iCU', 'https://forms.gle/jeBMfXQauLrSv2FUA', 9),
    ('1OElHyt5lyzDKwXLiLnYCevwwc4BiHLZZ1TnbZpXGu0k', 'https://forms.gle/MW3X6ekkX3EWkUDr5', 10),
    ('1XxyUtL0ME5kwueKxzYDNF3DSth9otCJUrdOUJgDhwlA', 'https://forms.gle/kzT6R188b55p1v666', 7),
    ('1y5EteBuHiwfUfN0Q9jsBUN8I7rQfDr0tiQy3BmOgGUo', 'https://forms.gle/btDdzpvETf5TZ8c59', 14),
    ('1Nfl0gI_nuTc9aWlU2t9_3Y8-ofHSkG8Fh7FvhAwz2bA', 'https://forms.gle/4J9MMgjGXq7ZQ7D39', 5),
    ('1q40TMU8fppOItURR3PLneyvMuGd2bZ-2vdV_jffnNuk', 'https://forms.gle/ea1UKVVk8PujDFmQ6', 10),
    ('1Cn2EPjwC_zFxfIBB9uxrURklrcob9XUjlJZ8W3Najh4', 'https://forms.gle/s117jH9s9SauyqPr7', 5),
    ('1rZ_ewtr2AyYcSI4s27Ejeoudu5tE1OMKHH0x926pIGo', 'https://forms.gle/94njBvbjtTneygKx5', 9),
    ('1VPsEApavhHUA2DM70utndHoSOP3l31JLcIXbSjGnyPU', 'https://forms.gle/gQXF2ZdpFB6JPrht6', 5),
    ('1AS59wal7XplZkWmCZfkYvMQTWUWcN4fQPcuUd7qwKSw', 'https://forms.gle/gsssFZqRsZP67QY2A', 11),
    ('1hHQ6Mlu6IHzokIjP_AWJPFxDkdi74S1WgkrpETUcF5E', 'https://forms.gle/VVwQQBH2tZC7g4FF9', 8),
    ('1ObyTvshGc6082z2NjnYgx-4R_mfy1tiiLyf5zX8LzvI', 'https://forms.gle/H8EN71WgH2n18wWd8', 8),
    ('1MAMuTuqrbebBMOjhsB81_DRR3A3voZAaq05Q44kpuUY', 'https://forms.gle/Nmw9nreHufmCYTC89', 6),
    ('1i2TVLsQV8MiTRxYDAe5PRFMrnvTsIyLZhhJd8l0xA2w', 'https://forms.gle/qS1QYPbZekcSwdXt7', 9),
    ('1UfG9yS4k-eE90foN8CGhQh7vhdD6pe92YfQZZMpROq4', 'https://forms.gle/DgiMdoJfUnoYu9Jr9', 4),
    ('1fowFd1-fXRUVEI_NeY3d08YcR8ZN4t1JOSs069YMHf0', 'https://forms.gle/XU9GN3tkjFcKEcUN6', 2),
    ('1fAeLGPOk9moaKsZQtHWowcCHcb4Bei_t1XGMBMG-O8E', 'https://forms.gle/1UtAM6eyoiTAfojo9', 7),
    ('1KE4cgcmG_IDMCFs1keigi8HF3OTF2VopGsMBZBO9cWk', 'https://forms.gle/GwnZo1aH7HkfZCrd8', 8),
    ('13j6yCUIuAWJf9MAZEVGSqk6fYrciVhRzMRQONAWZFM4', 'https://forms.gle/ESq9QZiwsDXNnsZo7', 7),
    ('1PMIA5vDcuznxdaG5c50qwfthFlDGYrtI76OrH6d8Do0', 'https://forms.gle/35kwGzD9itQPM71f7', 5),
    ('1iAjjSDrfFkHsll7mGo-vuvlqd14lM3VYk5CGTx_bjcc', 'https://forms.gle/u8cxNuH1wgsXZUxm7', 7),
    ('1vq87fe1mYaVRiJBCC_MMcJ6dH-3O1yOppmwgFen-pPs', 'https://forms.gle/gZsPnfxUw6oamB516', 3),
    ('12GhLBtG3bILCn66f83HBhaYyQK9y2WM-m0LkhM_jJ1Q', 'https://forms.gle/UrT2gCphsc1g4P9A7', 11),
    ('1Od75cTdqoK6soI2K6liMnDx1Tx9dUXh6crNsU6TpbVA', 'https://forms.gle/53g2qBYGwMQKKPAY7', 5),
    ('112V_aiVCMFTSTgjzag37xEMVgCWJbUYjPZe3kOv5fW8', 'https://forms.gle/RiVJAQDBTu5erzST7', 6),
    ('1WxqjIE5kaQNnDJFf3BXk6ci6M-wJ_gi1vqXvRoS_Qcg', 'https://forms.gle/4Nu6Xxg9adGhgvpC7', 6),
    ('19xylDrGGVO0-sEx5UVUEAae96D1A9fIBQif8MdhBmw4', 'https://forms.gle/rcrL43tFgMUQe4aw9', 6),
    ('1Qmk7WBBKnR-eA5kmsqh71Pj15y9OckOVrmUI7SllfU0', 'https://forms.gle/1ME183rfTUiGc1QX9', 11),
    ('1ce4yFqQTom_ewu9qgf4FoZEFQ5ntZKt7iQUNNYbRR88', 'https://forms.gle/Q6LEyYEockSZAgHq5', 16),
    ('1vyfazXzBCnSJNampiKIujyzVrL8yido89e3cCb39K3s', 'https://forms.gle/z1khhsqkLfkpRkRy7', 16),
    ('1CtbcCwOW5BNS8mZcWKnTbOsmQIlWnZjs9MTMPpy6zQ4', 'https://forms.gle/VRooT8UQknVeZaj1A', 19),
    ('1YUgOvR5roSJcmKA7swX1Ylv9G9jGCLfWGsUaCvCrHPU', 'https://forms.gle/n4pQF96nyTqKbX4F7', 5)
)
update public.quizzes as quiz
set quiz_url = source.quiz_url,
    max_marks = source.max_marks
from source_quizzes as source
where quiz.spreadsheet_id = source.spreadsheet_id;

commit;
