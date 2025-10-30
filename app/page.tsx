import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// NOTE: Keep lucide-react imports minimal to reduce CDN fetch risks.
import { CheckCircle2, MapPin, ShoppingCart, Package, Clock, Leaf, Star, Store, QrCode, Truck, Settings, Shield, Users, ListChecks } from "lucide-react";

/**
 * FIX: Removed duplicate default export of `ButineWireframes` that caused:
 * SyntaxError: Identifier 'ButineWireframes' has already been declared.
 * Now there's a single default export at the bottom.
 */

/** Local inline Bee icon (fallback to avoid CDN fetch issues) */
function BeeIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M32 4l22 12v24L32 52 10 40V16z" fill="#F5B800" opacity="0.2" />
      <ellipse cx="22" cy="22" rx="10" ry="6" fill="#FFF7E6" />
      <ellipse cx="42" cy="22" rx="10" ry="6" fill="#FFF7E6" />
      <ellipse cx="32" cy="30" rx="16" ry="12" fill="#1F2933" />
      <rect x="18" y="28" width="28" height="4" fill="#F5B800" />
      <rect x="20" y="28" width="24" height="4" fill="#FFF7E6" opacity="0.8" />
      <circle cx="18" cy="30" r="4" fill="#1F2933" />
      <path d="M16 28c-3-4-5-6-8-7" stroke="#1F2933" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M48 36c0-4 6-4 6 0 0 5-4 8-4 10 0-2-2-5-2-10z" fill="#E89C00" stroke="#1F2933" strokeWidth="1.5" />
    </svg>
  );
}

// --- Loyalty system (mock rules) ---
const loyaltyRules = {
  pointsPerEuro: 10, // 1 euro paye = 10 points
  redeemRate: 100,   // 100 points = 1 euro de remise (maquette)
  tiers: [
    { name: "Butineur", threshold: 0, perk: "+5% points" },
    { name: "Super Butineur", threshold: 500, perk: "+10% points" },
    { name: "Maitre Butineur", threshold: 1500, perk: "+15% points" },
  ],
};
function calcPoints(amountEuro: number, tierBonusPct = 0) {
  const base = Math.round(amountEuro * loyaltyRules.pointsPerEuro);
  const bonus = Math.round(base * (tierBonusPct / 100));
  return base + bonus;
}

// --- Fake data ---
const producers = [
  { id: "p1", name: "Rucher des Coteaux", city: "Ermont", postal: "95120", rating: 4.8, badges: ["Bio", "Local"], varieties: ["Acacia", "Chataignier"], distanceKm: 4.2 },
  { id: "p2", name: "Les Abeilles d'Ile-de-France", city: "Eaubonne", postal: "95600", rating: 4.6, badges: ["Local"], varieties: ["Toutes Fleurs"], distanceKm: 7.1 },
];

const products = [
  { id: 1, title: "Miel d'acacia 500g", price: 9.9, variety: "Acacia", producerId: "p1" },
  { id: 2, title: "Miel de chataignier 500g", price: 8.9, variety: "Chataignier", producerId: "p1" },
  { id: 3, title: "Miel toutes fleurs 250g", price: 5.9, variety: "Toutes Fleurs", producerId: "p2" },
];

const slots = [
  { id: 1, day: "Mercredi", hours: "18:00-20:00", left: 8 },
  { id: 2, day: "Samedi", hours: "10:00-12:00", left: 12 },
];

// Loyalty mock state
const loyaltyState = {
  balance: 240, // points actuels client
  tier: loyaltyRules.tiers[0],
  history: [
    { id: "h1", date: "2025-09-20", label: "Commande #1024", points: +120 },
    { id: "h2", date: "2025-08-11", label: "Commande #987", points: +80 },
    { id: "h3", date: "2025-07-05", label: "Remise appliquee", points: -100 },
  ],
};

// ---- Minimal runtime tests (smoke tests) ----
function runTests() {
  const results: { name: string; passed: boolean; details?: string }[] = [];
  // T1: producers non empty
  results.push({ name: "T1: producers non-empty", passed: Array.isArray(producers) && producers.length > 0 });
  // T2: product prices are numbers > 0
  const pricesOk = products.every(p => typeof p.price === "number" && p.price > 0);
  results.push({ name: "T2: valid product prices", passed: pricesOk });
  // T3: product producerId exists
  const producerIds = new Set(producers.map(p => p.id));
  const mappingOk = products.every(p => producerIds.has(p.producerId));
  results.push({ name: "T3: product->producer mapping", passed: mappingOk });
  // T4: slots integrity
  const slotIds = new Set(slots.map(s => s.id));
  const uniqueSlots = slotIds.size === slots.length && slots.every(s => s.left >= 0);
  results.push({ name: "T4: slots unique & non-negative", passed: uniqueSlots });
  // T5: loyalty calc points (9.90 euro @ base tier => 99 pts)
  const t5 = calcPoints(9.9) === 99;
  results.push({ name: "T5: calcPoints basic", passed: t5 });
  // T6: tiers thresholds ascending and non-negative
  const t6 = loyaltyRules.tiers.every((t, i, arr) => t.threshold >= 0 && (i === 0 || t.threshold >= arr[i-1].threshold));
  results.push({ name: "T6: tier thresholds valid", passed: t6 });
  // T7: redeem rate sanity
  results.push({ name: "T7: redeem rate >= 1", passed: loyaltyRules.redeemRate >= 1 });
  // T8: bonus calculation (10 euro with 10% bonus => 110 pts)
  results.push({ name: "T8: calcPoints bonus", passed: calcPoints(10, 10) === 110 });
  // T9: loyalty balance non-negative
  results.push({ name: "T9: loyalty balance non-negative", passed: loyaltyState.balance >= 0 });
  // T10: no fancy dashes in slot hours
  results.push({ name: "T10: slot hours use ASCII hyphen", passed: slots.every(s => !/[\u2013\u2014]/.test(s.hours)) });
  return results;
}

// --- UI atoms ---
function ProducerCard({ p }: { p: typeof producers[number] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" /> {p.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" /> {p.city} ({p.postal}) · {p.distanceKm} km
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4" /> {p.rating}
          <div className="flex gap-2">{p.badges.map(b => <Badge key={b} variant="secondary">{b}</Badge>)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.varieties.map(v => (
            <Badge key={v} className="bg-amber-100 text-amber-900">{v}</Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="rounded-2xl">Voir la boutique</Button>
          <Button size="sm" variant="secondary" className="rounded-2xl">Ajouter aux favoris</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCard({ p }: { p: typeof products[number] }) {
  const earnPts = calcPoints(p.price, loyaltyState.tier.name === "Super Butineur" ? 10 : loyaltyState.tier.name === "Maitre Butineur" ? 15 : 0);
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="aspect-video w-full rounded-xl bg-amber-50 flex items-center justify-center">
          <BeeIcon className="h-10 w-10" />
        </div>
        <div className="font-medium flex items-center justify-between">
          <span>{p.title}</span>
          <Badge variant="secondary" title="Avantage Butine (points fidelite)">+{earnPts} pts</Badge>
        </div>
        <div className="flex items-center justify-between">
          <Badge className="bg-amber-100 text-amber-900">{p.variety}</Badge>
          <div className="text-lg font-semibold">{p.price.toFixed(2)} €</div>
        </div>
        <Button className="rounded-2xl"><ShoppingCart className="h-4 w-4 mr-2"/>Ajouter</Button>
      </CardContent>
    </Card>
  );
}

// --- Screens ---
function ScreenHome() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Input placeholder="Rechercher une variete (acacia, lavande...)" />
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Distance"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">{"<= 10 km"}</SelectItem>
              <SelectItem value="25">{"<= 25 km"}</SelectItem>
              <SelectItem value="50">{"<= 50 km"}</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Label"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="bio">Bio</SelectItem>
              <SelectItem value="igp">IGP</SelectItem>
            </SelectContent>
          </Select>
          <Button className="rounded-2xl">Rechercher</Button>
        </div>
        <Button variant="secondary" className="rounded-2xl"><Leaf className="mr-2 h-4 w-4"/>Local pres de moi</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {producers.map(p => <ProducerCard key={p.id} p={p}/>) }
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Produits populaires</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => <ProductCard key={p.id} p={p}/>) }
        </div>
      </div>
    </div>
  );
}

function ScreenProducer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Store className="h-5 w-5"/>Rucher des Coteaux</h2>
          <div className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/>Ermont (95120) · <Star className="h-4 w-4"/>4.8</div>
        </div>
        <div className="flex gap-2"><Badge>Bio</Badge><Badge variant="secondary">Local</Badge></div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Prochains creneaux de retrait (Click & Collect)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {slots.map(s => (
            <Button key={s.id} variant="secondary" className="rounded-2xl"><Clock className="mr-2 h-4 w-4"/>{s.day} · {s.hours} · {s.left} places</Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.filter(p => p.producerId === "p1").map(p => <ProductCard key={p.id} p={p}/>) }
      </div>
    </div>
  );
}

function ScreenCartCheckout() {
  const subTotal = products.slice(0,2).reduce((acc, p) => acc + p.price, 0);
  const earnPts = calcPoints(subTotal, loyaltyState.tier.name === "Super Butineur" ? 10 : loyaltyState.tier.name === "Maitre Butineur" ? 15 : 0);
  const canRedeem = loyaltyState.balance >= loyaltyRules.redeemRate; // 100 pts = 1 euro demo
  const redeemEuro = canRedeem ? Math.floor(loyaltyState.balance / loyaltyRules.redeemRate) : 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 rounded-2xl">
        <CardHeader><CardTitle>Panier</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {products.slice(0,2).map(p => (
            <div key={p.id} className="flex items-center justify-between border rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center"><BeeIcon className="h-5 w-5"/></div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {p.title}
                    <Badge variant="secondary">+{calcPoints(p.price)} pts</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{p.variety}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select>
                  <SelectTrigger className="w-[80px]"><SelectValue placeholder="1"/></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="w-20 text-right font-semibold">{p.price.toFixed(2)} €</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Retrait & Paiement</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Choix du creneau</div>
            <Select>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selectionner un creneau"/></SelectTrigger>
              <SelectContent>
                {slots.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.day} · {s.hours}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-xl p-3 bg-amber-50/50">
            <div className="text-sm font-medium">Fidelite Butine</div>
            <div className="text-xs text-muted-foreground">Solde: <strong>{loyaltyState.balance} pts</strong> · Vous gagnerez <strong>+{earnPts} pts</strong> sur cette commande.</div>
            <div className="text-xs text-muted-foreground">{canRedeem ? `Vous pouvez utiliser jusqu'a ${redeemEuro} € en points.` : `Vous cumulez des points a chaque commande.`}</div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Sous-total</span><span>{subTotal.toFixed(2)} €</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Frais de retrait</span><span>0,00 €</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span><span>{subTotal.toFixed(2)} €</span>
          </div>
          <Button className="w-full rounded-2xl"><Package className="mr-2 h-4 w-4"/>Payer en ligne</Button>
          <p className="text-xs text-muted-foreground">Paiements securises - CB, Apple Pay, Google Pay</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenSellerDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Ventes du mois</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold">1 240 €</div>
          <div className="text-sm text-muted-foreground">62 commandes - panier moyen 20,0 €</div>
          <Button size="sm" variant="secondary" className="rounded-2xl">Exporter CSV</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader><CardTitle>Produits</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Titre" />
            <Select>
              <SelectTrigger><SelectValue placeholder="Variete"/></SelectTrigger>
              <SelectContent>
                {["Acacia","Chataignier","Lavande","Toutes Fleurs"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Prix (euro)" type="number" />
          </div>
          <Textarea placeholder="Description" />
          <div className="flex gap-2">
            <Button className="rounded-2xl">Ajouter le produit</Button>
            <Button variant="secondary" className="rounded-2xl">Importer depuis CSV</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {products.map(p => (
              <Card key={p.id} className="rounded-xl border-dashed">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-muted-foreground">Stock: 24 - {p.variety}</div>
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-2xl">Modifier</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl lg:col-span-3">
        <CardHeader><CardTitle>Creneaux Click & Collect</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select>
              <SelectTrigger><SelectValue placeholder="Jour"/></SelectTrigger>
              <SelectContent>
                {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="time" defaultValue="18:00"/>
            <Input type="time" defaultValue="20:00"/>
            <Button className="rounded-2xl"><Clock className="mr-2 h-4 w-4"/>Ajouter un creneau</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map(s => <Badge key={s.id} variant="secondary">{s.day} {s.hours}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenPickupTicket() {
  return (
    <div className="max-w-md mx-auto">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5"/>Ticket de retrait</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="aspect-square rounded-xl bg-amber-50 flex items-center justify-center">
            <div className="text-2xl font-mono">BUTINE-3F9K2</div>
          </div>
          <div className="text-sm text-muted-foreground">
            Presentez ce code au producteur. Creneau: <strong>Mercredi 18:00-20:00</strong> - Rucher des Coteaux, Ermont.
          </div>
          <Button className="w-full rounded-2xl"><CheckCircle2 className="mr-2 h-4 w-4"/>Ajouter a Wallet</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenRelays() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Points relais partenaires</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Store className="h-4 w-4"/>Boulangerie du Centre - 08:00-19:30 - Ermont</div>
          <div className="flex items-center gap-2"><Store className="h-4 w-4"/>Epicerie Verte - 10:00-20:00 - Eaubonne</div>
          <div className="flex items-center gap-2"><Truck className="h-4 w-4"/>Depot hebdomadaire: Vendredi 18:00</div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenLoyalty() {
  const nextTier = loyaltyRules.tiers.find(t => t.threshold > loyaltyState.balance);
  const missing = nextTier ? nextTier.threshold - loyaltyState.balance : 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Mon solde</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold">{loyaltyState.balance} pts</div>
          <div className="text-sm text-muted-foreground">Niveau: <strong>{loyaltyState.tier.name}</strong></div>
          {nextTier ? (
            <div className="text-xs text-muted-foreground">Encore <strong>{missing}</strong> pts pour <strong>{nextTier.name}</strong> ({nextTier.perk}).</div>
          ) : (
            <div className="text-xs text-muted-foreground">Vous etes au palier maximum. Bravo !</div>
          )}
          <div className="text-xs">Taux : {loyaltyRules.pointsPerEuro} pts / euro - {loyaltyRules.redeemRate} pts = 1 euro</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loyaltyState.history.map(h => (
            <div key={h.id} className="flex items-center justify-between border rounded-xl p-2">
              <div className="text-sm">{h.date} - {h.label}</div>
              <Badge className={h.points > 0 ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}>{h.points > 0 ? `+${h.points} pts` : `${h.points} pts`}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl lg:col-span-3">
        <CardHeader><CardTitle>Paliers & Avantages</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loyaltyRules.tiers.map(t => (
            <Card key={t.name} className="rounded-xl">
              <CardContent className="p-3 space-y-1">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-muted-foreground">A partir de {t.threshold} pts</div>
                <Badge variant="secondary">{t.perk}</Badge>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenPolicies() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Garanties & CGU - Rappel</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Protection achat Butine: SAV simple si pot fele (commandes passees dans l'app).</li>
            <li>Remises fidelite applicables uniquement aux commandes Butine.</li>
            <li>Les coordonnees sont masquees: echange via tchat in-app; garanties valables sur commandes validees (QR scanne).</li>
            <li>Les avantages logistiques (points relais negocies) s'appliquent aux commandes tracees dans l'app.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenTests() {
  const results = useMemo(() => runTests(), []);
  return (
    <div className="space-y-3">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Tests (smoke)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <span>{r.name}</span>
              <Badge className={r.passed ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}>{r.passed ? "PASS" : "FAIL"}</Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Ces tests verifient la coherence des donnees mock, y compris la fidelite.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenAdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Résumé commandes</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>Aujourd'hui : <strong>18</strong></div>
          <div>Semaine : <strong>126</strong></div>
          <div>En attente : <Badge className="bg-amber-100 text-amber-900">7</Badge></div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Apiculteurs actifs</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>Total : <strong>42</strong></div>
          <div>En attente de validation : <Badge variant="secondary">3</Badge></div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Incidents</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>Remboursements ouverts : <Badge className="bg-red-100 text-red-900">2</Badge></div>
          <div>Litiges transport : 1</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl lg:col-span-3">
        <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button className="rounded-2xl" variant="secondary">Valider nouveaux apiculteurs</Button>
          <Button className="rounded-2xl" variant="secondary">Voir commandes en attente</Button>
          <Button className="rounded-2xl" variant="secondary">Télécharger rapports</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenAdminOrders() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Commandes</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[{id:"C1024", customer:"Paul", total:29.8, status:"En attente"},{id:"C1025", customer:"Lea", total:9.9, status:"Payée"}].map(o => (
            <div key={o.id} className="grid grid-cols-4 items-center border rounded-xl p-2">
              <div className="font-mono">{o.id}</div>
              <div>{o.customer}</div>
              <div className="font-semibold">{o.total.toFixed(2)} €</div>
              <div><Badge variant="secondary">{o.status}</Badge></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenAdminProducers() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Apiculteurs</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {producers.map(p => (
            <div key={p.id} className="grid grid-cols-5 items-center border rounded-xl p-2">
              <div className="col-span-2">{p.name}</div>
              <div>{p.city}</div>
              <div>{p.postal}</div>
              <div className="text-right"><Button size="sm" variant="secondary" className="rounded-2xl">Voir</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenAdminCustomers() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Clients</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[{name:"Nadia", email:"nadia@example.com"},{name:"Hugo", email:"hugo@example.com"}].map((u,i) => (
            <div key={i} className="grid grid-cols-4 items-center border rounded-xl p-2">
              <div className="col-span-2">{u.name}</div>
              <div className="text-muted-foreground">{u.email}</div>
              <div className="text-right"><Button size="sm" variant="secondary" className="rounded-2xl">Historique</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ScreenAdminSettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Commissions</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 items-center"><span>Taux par défaut</span><Input defaultValue={"10"} type="number"/></div>
          <div className="grid grid-cols-2 gap-2 items-center"><span>Frais paiement (Stripe)</span><Input defaultValue={"1.4"} type="number"/></div>
          <Button className="rounded-2xl">Enregistrer</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Règlement & Modération</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between border rounded-xl p-2"><span>Validation automatique des apiculteurs</span><Badge variant="secondary">Off</Badge></div>
          <div className="flex items-center justify-between border rounded-xl p-2"><span>Politique retours</span><Button size="sm" variant="secondary" className="rounded-2xl">Éditer</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ButineWireframes() {
  useEffect(() => {
    const r = runTests();
    // eslint-disable-next-line no-console
    console.table(r);
  }, []);
  const [openNav, setOpenNav] = useState(false);

  return (
    <div className="p-6 bg-amber-50 min-h-screen overflow-visible">
      <div className="max-w-7xl mx-auto space-y-6 overflow-visible px-2 md:px-4">
        <header className="rounded-xl bg-white text-[#131313] border border-black/5 shadow-sm px-4 py-3 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <button className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10" aria-label="Ouvrir le menu" onClick={() => setOpenNav(true)}>
      <span className="text-xs font-semibold">MENU</span>
    </button>
    <div className="h-7 w-7 rounded-md bg-amber-400" />
    <div>
      <div className="text-sm text-neutral-500">Butine - Console</div>
      <div className="font-semibold leading-4">Du rucher a votre table</div>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="secondary" className="rounded-2xl h-8 px-3 hidden md:inline-flex">Aide</Button>
    <div className="h-8 w-8 rounded-full bg-neutral-200" />
  </div>
</header>

        <Tabs defaultValue="home" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] items-start gap-4 overflow-visible relative">
  {/* MOBILE OVERLAY */}
  {openNav && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpenNav(false)} />}

  {/* LEFT VERTICAL MENU */}
  <aside className={`${openNav ? 'fixed top-20 left-4 right-4 z-50 md:static' : 'hidden md:block'} self-start`}>
    <Card className="h-fit md:sticky md:top-4 rounded-2xl shadow-md">
      <CardHeader className="pb-1"><CardTitle className="text-sm uppercase tracking-wide text-neutral-500">Menu</CardTitle></CardHeader>
      <CardContent className="pt-0">
        {/* Section: Clients */}
        <TabsList className="flex flex-col items-stretch w-full bg-transparent p-1 gap-1">
          <TabsTrigger value="home" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Leaf className="h-4 w-4"/><span className="truncate">Accueil / Recherche</span></span>
          </TabsTrigger>
          <TabsTrigger value="checkout" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><ShoppingCart className="h-4 w-4"/><span className="truncate">Panier & Paiement</span></span>
          </TabsTrigger>
          <TabsTrigger value="ticket" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><QrCode className="h-4 w-4"/><span className="truncate">Ticket retrait</span></span>
          </TabsTrigger>
          <TabsTrigger value="relays" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><MapPin className="h-4 w-4"/><span className="truncate">Points relais</span></span>
            <Badge className="shrink-0 h-5 px-2 text-[11px]">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="loyalty" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Star className="h-4 w-4"/><span className="truncate">Fidelite</span></span>
            <Badge variant="secondary" className="shrink-0 h-5 px-2 text-[11px]">Nouveau</Badge>
          </TabsTrigger>
          <TabsTrigger value="policies" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><CheckCircle2 className="h-4 w-4"/><span className="truncate">Garanties (CGU)</span></span>
            <Badge variant="secondary" className="shrink-0 h-5 px-2 text-[11px]">Info</Badge>
          </TabsTrigger>
          
        </TabsList>

        {/* Divider */}
        <div className="h-px bg-neutral-200 my-2" />
        <div className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-500">Pro</div>

        {/* Section: Pro (au bas du menu) */}
        <TabsList className="flex flex-col items-stretch w-full bg-transparent p-1 gap-1">
          <TabsTrigger value="seller" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Package className="h-4 w-4"/><span className="truncate">Vendre mon miel</span></span>
            <Badge variant="secondary" className="shrink-0 h-5 px-2 text-[11px]">Pro</Badge>
          </TabsTrigger>
          <TabsTrigger value="tests" onClick={() => setOpenNav(false)}
            className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none text-neutral-700 hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Leaf className="h-4 w-4 rotate-90"/><span className="truncate">Tests</span></span>
          </TabsTrigger>
        </TabsList>
{/* Divider */}
        <div className="h-px bg-neutral-200 my-2" />
        <div className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-500">Admin</div>

        {/* Section: Admin */}
        <TabsList className="flex flex-col items-stretch w-full bg-transparent p-1 gap-1">
          <TabsTrigger value="admin" onClick={() => setOpenNav(false)} className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Shield className="h-4 w-4"/><span className="truncate">Tableau de bord</span></span>
            <Badge className="shrink-0 h-5 px-2 text-[11px]">Admin</Badge>
          </TabsTrigger>
          <TabsTrigger value="admin-orders" onClick={() => setOpenNav(false)} className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><ListChecks className="h-4 w-4"/><span className="truncate">Commandes</span></span>
          </TabsTrigger>
          <TabsTrigger value="admin-producers" onClick={() => setOpenNav(false)} className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Store className="h-4 w-4"/><span className="truncate">Apiculteurs</span></span>
          </TabsTrigger>
          <TabsTrigger value="admin-customers" onClick={() => setOpenNav(false)} className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Users className="h-4 w-4"/><span className="truncate">Clients</span></span>
          </TabsTrigger>
          <TabsTrigger value="admin-settings" onClick={() => setOpenNav(false)} className="inline-flex items-center justify-between w-full rounded-md h-10 px-3 text-sm font-medium gap-2 leading-none hover:bg-amber-50">
            <span className="flex items-center gap-2 min-w-0"><Settings className="h-4 w-4"/><span className="truncate">Parametres</span></span>
          </TabsTrigger>
        </TabsList>

<div className="mt-2 p-3 rounded-md border bg-amber-50/60 text-xs text-neutral-700 space-y-1">
  <div className="font-medium text-neutral-800">3 etapes pour demarrer</div>
  <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5"/> Creer un produit</div>
  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5"/> Definir vos creneaux</div>
  <div className="flex items-center gap-2"><QrCode className="h-3.5 w-3.5"/> Partager le QR pour retrait</div>
</div>
      </CardContent>
    </Card>
  </aside>

  {/* RIGHT CONTENT AREA */}
  <div>
    <TabsContent value="home" className="mt-0 overflow-visible"><ScreenHome/></TabsContent>
    <TabsContent value="producer" className="mt-0 overflow-visible"><ScreenProducer/></TabsContent>
    <TabsContent value="checkout" className="mt-0 overflow-visible"><ScreenCartCheckout/></TabsContent>
    <TabsContent value="seller" className="mt-0 overflow-visible"><ScreenSellerDashboard/></TabsContent>
    <TabsContent value="ticket" className="mt-0 overflow-visible"><ScreenPickupTicket/></TabsContent>
    <TabsContent value="relays" className="mt-0 overflow-visible"><ScreenRelays/></TabsContent>
    <TabsContent value="loyalty" className="mt-0 overflow-visible"><ScreenLoyalty/></TabsContent>
    <TabsContent value="policies" className="mt-0 overflow-visible"><ScreenPolicies/></TabsContent>
    <TabsContent value="tests" className="mt-0 overflow-visible"><ScreenTests/></TabsContent>
    <TabsContent value="admin" className="mt-0 overflow-visible"><ScreenAdminDashboard/></TabsContent>
    <TabsContent value="admin-orders" className="mt-0 overflow-visible"><ScreenAdminOrders/></TabsContent>
    <TabsContent value="admin-producers" className="mt-0 overflow-visible"><ScreenAdminProducers/></TabsContent>
    <TabsContent value="admin-customers" className="mt-0 overflow-visible"><ScreenAdminCustomers/></TabsContent>
    <TabsContent value="admin-settings" className="mt-0 overflow-visible"><ScreenAdminSettings/></TabsContent>
  </div>
</div>
</Tabs>
      </div>
    </div>
  );
}
