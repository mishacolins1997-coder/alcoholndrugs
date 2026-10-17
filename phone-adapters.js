/* Адаптеры телефона для Alcohol n Drugs.
 *
 * Расширение шлёт события трёх видов (item.kind): 'bank', 'sms', 'channel'.
 * Поля item: who (кому), from (отправитель), text, amount (для bank), channel/channelId/action (для channel:
 * create | join | leave | post), dealerId, currency, t (игровой ход).
 *
 * Чтобы подключить телефон-расширение, зарегистрируйте адаптер ниже. Каждый метод необязателен.
 * Пока здесь нет реальных вызовов Phone-ST — их нужно вписать по его исходникам (см. описание в чате).
 *
 *   window.AlcoholNDrugs.phone.registerAdapter({
 *       name: 'phone-st',
 *       detect: () => !!window.<глобальный_объект_телефона>,
 *       bank(item)    { <добавить банковскую операцию item.amount / item.text> },
 *       sms(item)     { <добавить SMS от item.from к item.who с текстом item.text> },
 *       channel(item) { <create/join/leave/post в канал item.channel> },
 *   });
 *
 * Без адаптера уведомления видны во вкладке «📱 Телефон» панели расширения, а также доступны
 * через событие: window.addEventListener('alcohol-n-drugs:phone', e => console.log(e.detail)).
 */
export {};
