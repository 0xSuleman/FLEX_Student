# ── Build stage ───────────────────────────────────────────────────────────────
# Uses a Maven-preloaded image so we don't depend on the maven-wrapper's
# `unzip` requirement (which the temurin JDK image does not ship).
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline

COPY src src
RUN mvn -B -ntp -DskipTests package \
 && cp target/*.jar app.jar

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

# Non-root user for the JVM
RUN useradd -r -u 1001 -g root nuked
COPY --from=build /workspace/app.jar /app/app.jar

USER nuked
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
