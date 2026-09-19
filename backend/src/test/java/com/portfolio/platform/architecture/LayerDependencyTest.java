package com.portfolio.platform.architecture;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class LayerDependencyTest {

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
        Set<String> noRepoLayers = Set.of("controller", "scheduler", "aspect", "exception");
        List<String> violations = new ArrayList<>();

        for (ClassFile cf : scanClasses()) {
            if (noRepoLayers.contains(cf.layer())) {
                for (String imp : cf.imports()) {
                    if (imp.startsWith("com.portfolio.platform.repository.")) {
                        violations.add(cf.relativePath() + " imports " + imp);
                    }
                }
            }
            if ("controller".equals(cf.layer())) {
                for (String imp : cf.imports()) {
                    if (imp.startsWith("com.portfolio.platform.converter.")) {
                        violations.add(cf.relativePath() + " imports " + imp);
                    }
                }
            }
        }

        assertThat(violations)
                .withFailMessage("Architecture layer violations:\n" + String.join("\n", violations))
                .isEmpty();
    }
}
