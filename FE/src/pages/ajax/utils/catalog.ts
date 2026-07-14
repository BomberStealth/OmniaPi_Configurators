import logo from '../assets/logo.png';
import hub from '../assets/hub.jpg';
import sirenaEst from '../assets/sirena_est.jpg';
import sirenaInt from '../assets/sirena_int.jpg';
import telecomando from '../assets/telecomando.jpg';
import tastiera from '../assets/tastiera.jpg';
import contatto from '../assets/contatto.jpg';
import pir from '../assets/pir.jpg';
import tenda from '../assets/tenda.jpg';
import button from '../assets/button.jpg';
import motioncamOut from '../assets/motioncam_out.jpg';
import curtaincamOut from '../assets/curtaincam_out.jpg';
import curtainOut from '../assets/curtain_out.jpg';
import dualcurtainOut from '../assets/dualcurtain_out.jpg';
import keypadTouch from '../assets/keypad_touch.jpg';
import tag from '../assets/tag.jpg';
import keypadOut from '../assets/keypad_out.jpg';
import motioncamIn from '../assets/motioncam_in.jpg';

export const LOGO = logo;

export interface Device {
  id: string;
  codice: string;
  img: string;
  nome: string;
  tag: string;
  desc: string;
  specs: string[];
  listino: number;
}

export const DEVICES: Device[] = [
  { id: 'hub', codice: '51174.134.WH1', img: hub, nome: 'Hub 2 (4G)', tag: 'Il cervello dell’impianto',
    desc: 'È il cuore del sistema: riceve i segnali da tutti i sensori e, se qualcosa non va, avvisa te sul telefono e l’eventuale vigilanza. Si collega a internet via cavo, WiFi e scheda SIM 4G, così resta sempre attivo anche se salta la linea o la corrente.',
    specs: ['Ethernet + WiFi + 4G', 'Notifiche in tempo reale', 'Autonomia fino a 7 anni'], listino: 645 },
  { id: 'hub_plus', codice: '', img: hub, nome: 'Hub 2 Plus', tag: 'Centrale con foto-verifica',
    desc: 'Versione avanzata della centrale: gestisce l’intero impianto e supporta i sensori dotati di fotocamera, mostrandoti le foto degli allarmi direttamente nell’APP. Più canali di comunicazione (Ethernet, WiFi e doppia SIM) per la massima affidabilità.',
    specs: ['Ethernet + WiFi + 2× SIM', 'Supporto foto-verifica', 'Autonomia fino a 7 anni'], listino: 899 },
  { id: 'rex2', codice: '38207.106.WH1', img: hub, nome: 'ReX 2', tag: 'Estende la copertura radio',
    desc: 'Ripetitore di segnale: amplia la portata dell’impianto per raggiungere sensori lontani, in edifici grandi o su più piani. Fa in modo che ogni dispositivo resti sempre collegato alla centrale in modo affidabile.',
    specs: ['Estende il raggio d’azione', 'Ideale per edifici grandi / più piani', 'Wireless'], listino: 259 },
  { id: 'sirena_est', codice: '38178.07.WH1', img: sirenaEst, nome: 'StreetSiren', tag: 'Mette in fuga i ladri',
    desc: 'La sirena montata all’esterno dell’abitazione. Quando scatta l’allarme suona fortissimo e lampeggia, per far scappare i malintenzionati e farsi sentire dai vicini.',
    specs: ['Fino a 113 dB', 'Corona LED lampeggiante', 'Resistente agli agenti atmosferici'], listino: 182 },
  { id: 'sirena_int', codice: '38111.11.WH1', img: sirenaInt, nome: 'HomeSiren', tag: 'Assordante dentro casa',
    desc: 'La sirena posizionata all’interno. Suona molto forte dentro l’abitazione per spaventare chi è entrato e avvisare immediatamente le persone presenti.',
    specs: ['Regolabile fino a 100 dB', 'Indicatore LED'], listino: 96 },
  { id: 'telecomando', codice: '38166.04.WH1', img: telecomando, nome: 'SpaceControl', tag: 'Attivi/disattivi al volo',
    desc: 'Un piccolo telecomando da portachiavi. Con un tasto attivi o disattivi l’allarme, anche solo in parte, e c’è il pulsante antipanico per chiedere aiuto immediato.',
    specs: ['Inserimento / Disinserimento', 'Inserimento parziale', 'Pulsante antipanico'], listino: 49 },
  { id: 'button', codice: '', img: button, nome: 'Button', tag: 'Aiuto immediato',
    desc: 'Un pulsante da tenere sempre a portata di mano. Premendolo invii all’istante una richiesta di aiuto (allarme antipanico) anche se l’impianto è disinserito. Comodo per anziani, negozi o emergenze; è anche programmabile per comandare l’impianto.',
    specs: ['Allarme antipanico', 'Programmabile', 'Wireless'], listino: 0 },
  { id: 'tastiera', codice: '38249.12.WH1', img: tastiera, nome: 'KeyPad', tag: 'Comando a parete',
    desc: 'Il pannello a muro con cui accendi e spegni l’impianto digitando il tuo codice personale, comodamente e senza bisogno del telefono.',
    specs: ['Retroilluminazione LED', 'Codice personale', 'Gestione delle zone'], listino: 158 },
  { id: 'keypad_touch', codice: '58455.148.WH1', img: keypadTouch, nome: 'KeyPad TouchScreen', tag: 'Tastiera touch screen',
    desc: 'Tastiera wireless con schermo touch per accendere e spegnere l’impianto. Ci si identifica in più modi: con il codice, con una tessera o portachiavi (Pass e Tag) oppure direttamente con lo smartphone. Elegante e semplicissima da usare a parete.',
    specs: ['Touch screen', 'Codice / Pass / Tag', 'Autenticazione via smartphone'], listino: 467 },
  { id: 'keypad_out', codice: '99969.286.GP1', img: keypadOut, nome: 'KeyPad Outdoor', tag: 'Tastiera da esterno',
    desc: 'Tastiera con lettore RFID da montare all’esterno: accendi e spegni l’impianto dall’ingresso, con codice o tessera/portachiavi di prossimità. Robusta e resistente a pioggia e polvere (IP66).',
    specs: ['Da esterno (IP66)', 'Codice / Tag RFID', 'Antimanomissione'], listino: 203 },
  { id: 'tag', codice: '38232.90.WH', img: tag, nome: 'Tag (3 pz)', tag: 'Chiave senza contatto',
    desc: 'Portachiavi di prossimità: per inserire o disinserire l’impianto basta avvicinarlo alla tastiera, senza digitare codici. Ogni utente ha il suo. Confezione da 3 pezzi.',
    specs: ['Senza contatto (RFID)', 'Un tag per utente', 'Confezione da 3'], listino: 31 },
  { id: 'contatto', codice: '38099.03.WH1', img: contatto, nome: 'DoorProtect', tag: 'Protegge porte e finestre',
    desc: 'Si applica su porte e finestre in due pezzi. Se qualcuno le apre mentre l’allarme è inserito, la segnalazione scatta all’istante.',
    specs: ['Sensore di apertura', 'Wireless'], listino: 60 },
  { id: 'contatto_plus', codice: '38101.13.WH1', img: contatto, nome: 'DoorProtect Plus', tag: 'Versione avanzata',
    desc: 'Come il contatto magnetico, ma più completo: oltre all’apertura rileva anche gli urti (tentativi di scasso) e l’inclinazione, utile per tapparelle e serrande basculanti.',
    specs: ['Sensore di apertura', 'Sensore di urto (shock)', 'Sensore di inclinazione'], listino: 89 },
  { id: 'pir', codice: '38193.09.WH1', img: pir, nome: 'MotionProtect', tag: 'Sorveglia le stanze',
    desc: 'Il sensore che “vede” i movimenti all’interno di una stanza. Se qualcuno si muove ad allarme inserito, fa scattare l’allarme. Non si attiva per cani e gatti.',
    specs: ['Pet-immune', 'Filtro anti falsi allarmi'], listino: 96 },
  { id: 'motioncam_in', codice: '119282.310.WH1', img: motioncamIn, nome: 'MotionCam', tag: 'Movimento interno con foto',
    desc: 'Rilevatore di movimento da interno che, quando scatta l’allarme, scatta anche una serie di foto: così vedi subito sul telefono cosa lo ha fatto scattare. Pet-immune, ottimo per avere conferma visiva degli allarmi.',
    specs: ['Da interno', 'Foto-verifica (PhOD)', 'Pet-immune'], listino: 249 },
  { id: 'motioncam_out', codice: '', img: motioncamOut, nome: 'MotionCam Outdoor', tag: 'Movimento esterno con foto-verifica',
    desc: 'Rilevatore di movimento da esterno che, quando scatta l’allarme, scatta anche una serie di foto: così vedi subito sul telefono cosa ha fatto scattare l’allarme, ancora prima che qualcuno entri. Ignora cani e gatti e resiste al maltempo.',
    specs: ['Da esterno', 'Foto-verifica', 'Pet-immune', 'Anti-mascheramento'], listino: 0 },
  { id: 'curtaincam_out', codice: '', img: curtaincamOut, nome: 'CurtainCam Outdoor', tag: 'Tenda esterna con fotocamera',
    desc: 'Protegge il perimetro creando una “tenda” invisibile lungo la parete, davanti a finestre e balconi, e ha la fotocamera integrata: all’allarme fotografa chi si avvicina. Da montare in alto, ideale su facciate e terrazzi.',
    specs: ['Da esterno', 'Effetto tenda', 'Foto-verifica (PhOD)', 'Montaggio in alto'], listino: 0 },
  { id: 'curtain_mini', codice: '130273.345.WH1', img: tenda, nome: 'Curtain Outdoor Mini', tag: 'Tenda esterna compatta',
    desc: 'Sensore a tenda da esterno in versione compatta: crea una barriera invisibile davanti alle aperture e fa scattare l’allarme prima che qualcuno entri. Discreto, adatto a finestre e piccoli varchi.',
    specs: ['Da esterno', 'Effetto tenda', 'Formato compatto'], listino: 161 },
  { id: 'curtain_out', codice: '101441.289.WH1', img: curtainOut, nome: 'Curtain Outdoor', tag: 'Tenda esterna doppia tecnologia',
    desc: 'Sensore a tenda da esterno con doppia tecnologia di rilevamento: crea una barriera invisibile davanti alle aperture e fa scattare l’allarme prima dell’intrusione, riducendo al minimo i falsi allarmi causati da animali o intemperie.',
    specs: ['Da esterno', 'Doppia tecnologia', 'Effetto tenda', 'Pet-immune'], listino: 228 },
  { id: 'dualcurtain_out', codice: '39055.81.WH1', img: dualcurtainOut, nome: 'DualCurtain Outdoor', tag: 'Tenda doppio fascio',
    desc: 'Crea due “tende” invisibili contrapposte, una per lato: protegge il perimetro in entrambe le direzioni lungo la parete. Perfetto tra due edifici o lungo una recinzione, riconosce anche la direzione del movimento.',
    specs: ['Da esterno', 'Doppio fascio', 'Copertura bidirezionale', 'Anti falsi allarmi'], listino: 327 },
];

export const DEFAULT_INTRO = 'AJAX è un sistema di sicurezza intelligente, affidabile e velocissimo: reagisce solo a pericoli reali evitando i falsi allarmi. In caso di intrusione ti avvisa in un istante sul telefono e attiva le sirene. La comunicazione avviene contemporaneamente via Ethernet, WiFi e rete GSM, con notifiche in tempo reale sull’APP e chiamata in caso di allarme. Tutto senza fili, con batterie che durano fino a 7 anni.';

export const MARKUP = 1.5; // maggiorazione sul prezzo interno per il cliente finale

export type PriceMode = 'finale' | 'interno';

export function netPrice(listino: number, scontoPct: number): number {
  return listino * (1 - scontoPct / 100);
}

export function unitPrice(listino: number, scontoPct: number, mode: PriceMode): number {
  return netPrice(listino, scontoPct) * (mode === 'finale' ? MARKUP : 1);
}

export function formatEur(n: number): string {
  return '€ ' + (Math.round(n * 100) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
