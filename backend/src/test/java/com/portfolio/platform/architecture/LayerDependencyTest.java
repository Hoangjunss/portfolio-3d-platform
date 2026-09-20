package com.portfolio.platform.architecture;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;

class LayerDependencyTest {

    private static final Set<String> EXEMPT_LAYERS = Set.of("config", "filter", "root");

    private static final Map<String, Set<String>> ALLOWED_DEPENDENCIES = Map.ofEntries(
            entry("controller", Set.of("facade", "service", "dto", "form", "enums", "exception")),
            entry("scheduler", Set.of("facade", "service")),
            entry("aspect", Set.of("service", "annotation")),
            entry("exception", Set.of("service", "dto")),
            entry("facade", Set.of("service", "converter", "helper", "util", "dto", "form", "model", "enums", "exception")),
            // "constant" was declared as a leaf layer below but appeared in no allowed-set, so nothing
            // could import it. Plan 27 is the first code to create the package; service is its only
            // importer, so it is added here alone rather than everywhere.
            entry("service", Set.of("repository", "converter", "helper", "util", "dto", "model", "enums", "exception", "form", "annotation", "constant")),
            entry("converter", Set.of("util", "helper", "dto", "form", "model", "enums")),
            entry("helper", Set.of("repository", "model")),
            entry("repository", Set.of("model", "enums", "dto")),
            entry("model", Set.of("enums")),
            entry("dto", Set.of("model", "enums")),
            entry("form", Set.of("enums")),
            entry("enums", Set.of()),
            entry("annotation", Set.of()),
            entry("constant", Set.of()),
            entry("util", Set.of())
    );

    private static Path findSourceRoot() {
        Path p = Path.of("src/main/java/com/portfolio/platform");
        if (Files.isDirectory(p)) {
            return p;
        }
        p = Path.of("backend/src/main/java/com/portfolio/platform");
        if (Files.isDirectory(p)) {
            return p;
        }
        throw new IllegalStateException("Cannot find src/main/java/com/portfolio/platform");
    }

    private record ClassFile(String relativePath, String layer, String className, List<String> imports) {}

    private List<ClassFile> scanClasses() throws IOException {
        Path root = findSourceRoot();
        List<ClassFile> classes = new ArrayList<>();

        try (Stream<Path> stream = Files.walk(root)) {
            List<Path> javaFiles = stream.filter(p -> p.toString().endsWith(".java")).toList();
            for (Path file : javaFiles) {
                Path relative = root.relativize(file);
                String relPath = relative.toString().replace('\\', '/');
                String layer = relative.getNameCount() > 1 ? relative.getName(0).toString() : "root";
                String className = file.getFileName().toString().replace(".java", "");

                List<String> imports = Files.readAllLines(file).stream()
                        .map(String::trim)
                        .filter(l -> l.startsWith("import ") && l.endsWith(";"))
                        .map(l -> l.substring(7, l.length() - 1).trim())
                        .filter(l -> l.startsWith("com.portfolio.platform."))
                        .toList();

                classes.add(new ClassFile(relPath, layer, className, imports));
            }
        }
        return classes;
    }

    @Test
    void layerDependenciesMustFollowRules() throws IOException {
        List<String> violations = new ArrayList<>();

        for (ClassFile cf : scanClasses()) {
            if (EXEMPT_LAYERS.contains(cf.layer())) {
                continue;
            }

            Set<String> allowed = ALLOWED_DEPENDENCIES.get(cf.layer());

            for (String imp : cf.imports()) {
                String sub = imp.substring("com.portfolio.platform.".length());
                String targetLayer = sub.contains(".") ? sub.substring(0, sub.indexOf('.')) : sub;

                if (EXEMPT_LAYERS.contains(targetLayer) || targetLayer.equals(cf.layer())) {
                    continue;
                }

                if (allowed == null || !allowed.contains(targetLayer)) {
                    violations.add(cf.relativePath() + " imports " + imp);
                }
            }
        }

        assertThat(violations)
                .withFailMessage("Architecture layer violations:\n" + String.join("\n", violations))
                .isEmpty();
    }
}
