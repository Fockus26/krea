# D548 · UX · El capitán en otro teléfono arranca con el borrador del equipo; el de su teléfono gana · Implemented

**Decision:** la página le pasa al formulario del capitán `inicial` = lo del reparto (D461) más el borrador del servidor (`inicialDesdeBorrador`: textos tal cual, imágenes ya subidas listas con su ruta y vista previa firmada). El borrador local sigue restaurándose después y gana por pregunta (D196). Si en el teléfono había un borrador (quizá escrito sin red), al abrir se manda al equipo con la versión que trae la página.
**Why:** con el borrador en el servidor, cambiar de teléfono (o usar el de un compañero) ya no tiene por qué empezar de cero; y lo escrito sin red tiene que llegar al equipo cuando vuelve.
**Discarded alternative:** que el servidor gane sobre el local: pisaría lo escrito sin red en este teléfono. No cargarlo: el capitán vería en blanco lo que su equipo sí ve.
