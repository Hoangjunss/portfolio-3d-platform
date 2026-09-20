FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8080
# -Xmx350m is the spec section 7 budget. -Xss256k keeps per-thread stacks small because Tomcat
# holds a thread per in-flight request and the container ceiling is only 450m.
ENTRYPOINT ["java", "-Xmx350m", "-Xss256k", "-jar", "app.jar"]
