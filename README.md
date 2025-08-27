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
- semantical search 

Please see this table to understand the differences between lexical and semantical search.

<img width="903" height="217" alt="image" src="https://github.com/user-attachments/assets/2032a868-ef46-4a13-ab49-51af14293c76" />

## Key functionality 

The frontend is a Wordpress plug-in consisting of a query/result screen and a detail screen. The detail screen is used to show the result of a specific search result in case no landing page is available for the result.

The federation backend service API receives search requests from the frontend and returns results that conform to the selected standard/model. We will use the DCAT standard in the first prototype. This service queries existing endpoints (REST, GraphQL, SparQL). These endpoints may already support federation (like OpenCatalogi). 

The backend service also federates in its own. One can query multiple endpoints at once. The service combines the results into one response. 

<img width="800" height="500" alt="federated search diagram" src="https://github.com/data-ambassade/federatedsearch/blob/main/context%20diagram.png" />

## Semantical search

See below the perspective of Gartner on semantics (source: [Gartner report](https://github.com/data-ambassade/federatedsearch/blob/f4a188ab3a5c314f6362b3722eb76be0d68059cb/Gartner%20-%20datacatalog%20-%20metadatamanagement%20-%203834620-13613998.pdf))

<img width="1391" height="777" alt="image" src="https://github.com/user-attachments/assets/f096a17c-57ef-4132-93c5-31cfd3c0d46a" />

