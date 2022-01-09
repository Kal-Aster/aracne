# ARACNE
Gestore di monorepo

## Origine
Ho creato questa libreria perchè ero troppo pigro per imparare lerna o per trovarne un'alternativa e con le idee abbastanza chiare di cosa volessi da avere il coraggio di reinventare la ruota.

## Origine del nome
"Aracne" è il nome di un personaggio della mitologia greca, molto abile a tessere.

## Utilizzo
Successivamente all'installazione puoi eseguire i [comandi](#comandi) disponibili, riportati di seguito, eseguendo semplicemente:
> aracne *\<command>*

oppure
> npx aracne *\<command>*

## Comandi
### `import`
Ti permette di importare dei pacchetti esterni (non da remoto).  
_Un ringraziamento va a lerna, da cui è stato estratto il codice per la modifica dei percorsi dei file nei commit._

### `changed`
Ti permette di ricevere una lista dei pacchetti che risultano avere necessità di incremento della versione.

### `build`
Ti permette di costruire i pacchetti e collegarne le dipendenze interne.
Puoi far sapere ad Aracne come costruire i tuoi pacchetti configurando la [proprietà "build"](#%22build%22).
> La costruzione dei pacchetti non può essere separata dal collegamento delle dipendeze interne, siccome l'installazione delle dipendenze interne è indirizzata al pacchetto impacchettato e non alla cartella di origine, per evitare un collegamento simbolico.

### `version`
Ti permette di incrementare la versione dei pacchetti che risultano averne necessità.  
Questo comando include l'esecuzione di [build](#build) e il commit automatico delle modifiche. Questo comportamento può essere impedito aggiungendo l'opzione `--increase-only`.

### `restore`
Ti permette di sostituire nei file "package.json" l'installazione locale delle dipendenze interne con la loro versione corrente.  
Questo permette di preparare il pacchetto per la pubblicazione nel registro.

### `publish`
Ti permette di pubblicare i pacchetti nel registro.  
Questo comando include l'esecuzione di [version](#version), [restore](#restore) e, dopo la pubblicazione sul registro, [build](#build).

## Configurazione
Puoi configurare aracne creando un file nominato "aracne.json" nella cartella radice del tuo progetto avente un contenuto JSON valido.

Di seguito le proprietà configurabili.
### `"build"`
Questo definisce i comandi che verranno eseguiti per costruire i pacchetti  
Può essere `null`, una stringa, una lista di stringhe o un oggetto contenente come chiavi il nome del pacchetto o "\*", per selezionarli tutti, e come valore `null`, per ignorare la costruzione, una stringa o una lista di stringhe, che definiscono i comandi da eseguire.

### `"source"`
Questo definisce quali file implicano la necessità di incremento della versione del pacchetto dopo la loro modifica.  
Può essere una stringa, una lista di stringhe o un oggetto contenente come chiavi il nome del pacchetto o "\*", per selezionarli tutti, e come valore una stringa o una lista di stringhe.  

I valori seguono le regole glob estese.