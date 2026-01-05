# Federated search

Design & development of a customizable user interface (frontend) and federation service (backend API) for federated search with the following services.

- Build on existing federation services and search engines
- Standards & Model-driven - exchange of search results between frontend and backend comply to linked data model - configurable
- Metadata at the source - actual search results link directly to the source, no copying of metadata, no harvesting of metadata required
- AI Ready - backend service as a knowledge graph for LLM
- Open source

The objective of this development is to deliver a rich solution that helps people in setting up of a federative search based on open source software with a minimal dependency of developers or specific applications. It is easy to setup (docker) and easy to deploy and adapt into an existing infrastructure.

The project is split into 3 phases whereby future phases build on a stable release of a previous phase:

- lexical search - find results purely on words entered
- enriched lexical search with support of AI/LLM for enriching the search with synonyms ad suggestions.
- semantical & contextual search applying GraphRAG

Please see this table to understand the differences between lexical and semantical search.

<img width="903" height="217" alt="image" src="https://github.com/user-attachments/assets/2032a868-ef46-4a13-ab49-51af14293c76" />

## Key functionality 

The frontend is a Wordpress plug-in consisting of a query/result screen and a detail screen ('More Info'). The detail screen is used to show the result of a specific search result. It refers to the actual source of the metadata. In case no reference is supplied a detail page is shown with the metadata that was used for the federated search. 

The federation backend service API (implemented in NodeRed) receives search requests from the frontend and returns results that conform to the selected standard/model. We will use the DCAT standard in the first prototype. This API service queries routes the query to existing endpoints (REST, GraphQL, SparQL). The results from these endpoints is translated into JSON-LD with a DCAT2 compliant structure. 

The backend service federates in its own (parameter). One can query multiple endpoints at once. The service combines the results into one response.

<img width="800" height="500" alt="federated search diagram" src="https://github.com/data-ambassade/federatedsearch/blob/main/context%20diagram.png" />

## Option to not use node-red

The front-end has the ability to directly call the federated search of OpenCatalogi. In that case the back-end is not used. The results from the OpenCatalogi API are translated internally in the front-end into JSON-LD DCAT2 compliant. One can activitate this option as a parameter in the Wordpress plug-in of the Federated Search.

## Semantical & contextual search

See below the perspective of Gartner on semantics (source: Gartner: What Data and Analytics Leaders Should Know Before
Implementing a Data Catalog - Jason Medd - Data & Analytics summit 11-13 may 2026)

<img width="1391" height="777" alt="image" src="https://github.com/user-attachments/assets/f096a17c-57ef-4132-93c5-31cfd3c0d46a" />


